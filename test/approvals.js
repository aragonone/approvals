const { assertEvent } = require('@aragon/test-helpers/assertEvent')(web3)
const { assertRevert } = require('@aragon/test-helpers/assertThrow')
const { encodeCallScript } = require('@aragon/test-helpers/evmScript')
const { getEventArgument, getNewProxyAddress } = require('@aragon/test-helpers/events')

const Approvals = artifacts.require('Approvals')

const ACL = artifacts.require('ACL')
const Kernel = artifacts.require('Kernel')
const DAOFactory = artifacts.require('DAOFactory')
const ExecutionTarget = artifacts.require('ExecutionTarget')
const EVMScriptRegistryFactory = artifacts.require('EVMScriptRegistryFactory')

const INTENT_STATE = { PENDING: 0, APPROVED: 1, REJECTED: 2 }

contract('Approvals', ([_, root, user, moderator, someone]) => {
  let dao, acl, approvals
  let daoFactory, approvalsBase, kernelBase
  let SUBMIT_ROLE, APPROVE_ROLE, REJECT_ROLE, APP_MANAGER_ROLE

  before('deploy base implementations', async () => {
    kernelBase = await Kernel.new(true) // petrify immediately
    const aclBase = await ACL.new()
    const registryFactory = await EVMScriptRegistryFactory.new()
    daoFactory = await DAOFactory.new(kernelBase.address, aclBase.address, registryFactory.address)
    approvalsBase = await Approvals.new()
  })

  before('load constants', async () => {
    APP_MANAGER_ROLE = await kernelBase.APP_MANAGER_ROLE()
    SUBMIT_ROLE = await approvalsBase.SUBMIT_ROLE()
    APPROVE_ROLE = await approvalsBase.APPROVE_ROLE()
    REJECT_ROLE = await approvalsBase.REJECT_ROLE()
  })

  beforeEach('create DAO', async () => {
    const receipt = await daoFactory.newDAO(root)
    dao = Kernel.at(getEventArgument(receipt, 'DeployDAO', 'dao'))
    acl = ACL.at(await dao.acl())
    await acl.createPermission(root, dao.address, APP_MANAGER_ROLE, root, { from: root })
  })

  beforeEach('create approvals app', async () => {
    const receipt = await dao.newAppInstance('0x1234', approvalsBase.address, '0x', false, { from: root })
    approvals = Approvals.at(getNewProxyAddress(receipt))

    await acl.createPermission(user, approvals.address, SUBMIT_ROLE, root, { from: root })
    await acl.createPermission(moderator, approvals.address, APPROVE_ROLE, root, { from: root })
    await acl.createPermission(moderator, approvals.address, REJECT_ROLE, root, { from: root })
  })

  describe('initialize', () => {
    const from = root

    it('cannot initialize the base app', async () => {
      assert.isTrue(await approvalsBase.isPetrified(), 'base approvals app should be petrified')
      await assertRevert(approvalsBase.initialize({ from }), 'INIT_ALREADY_INITIALIZED')
    })

    it('can be initialized only once', async () => {
      await approvals.initialize({ from })
      assert.isTrue(await approvals.hasInitialized(), 'approvals should be initialized')
      await assertRevert(approvals.initialize({ from }), 'INIT_ALREADY_INITIALIZED')
    })
  })

  describe('submit', () => {
    const script = '0x0123456789abcdef'

    context('when the app has already been initialized', function () {
      beforeEach('initialize approvals app', async () => {
        await approvals.initialize()
      })

      context('when the sender is allowed to submit intents', () => {
        let intentId
        const from = user

        it('creates an intent', async () =>  {
          const receipt = await approvals.submit(script, { from })
          intentId = getEventArgument(receipt, 'IntentSubmitted', 'intentId')

          const [state, executionScript] = await approvals.getIntent(intentId)
          assert.equal(state.toString(), INTENT_STATE.PENDING, 'intent state does not match')
          assert.equal(executionScript, script, 'intent execution script does not match')
        })

        it('emits an event', async () => {
          const receipt = await approvals.submit(script, { from })
          assertEvent(receipt, 'IntentSubmitted', { submitter: user, intentId: 0 })
        })
      })

      context('when the sender is not allowed to submit intents', () => {
        const from = someone

        it('reverts', async () =>  {
          await assertRevert(approvals.submit(script, { from }), 'APP_AUTH_FAILED')
        })
      })
    })

    context('when it has not been initialized yet', function () {
      it('reverts', async () => {
        await assertRevert(approvals.submit(script, { from: user }), 'APP_AUTH_FAILED')
      })
    })
  })

  describe('approval', () => {
    let executionTarget, script

    beforeEach('build script', async () => {
      executionTarget = await ExecutionTarget.new()
      const action = { to: executionTarget.address, calldata: executionTarget.contract.execute.getData() }
      script = encodeCallScript([action])
    })

    context('when the app has already been initialized', function () {
      beforeEach('initialize approvals app', async () => {
        await approvals.initialize()
      })

      context('when the given intent exists', () => {
        let intentId

        beforeEach('create an intent', async () => {
          const receipt = await approvals.submit(script, { from: user })
          intentId = getEventArgument(receipt, 'IntentSubmitted', 'intentId')
        })

        context('when the sender is allowed to approve intents', () => {
          const from = moderator

          context('when the given intent is pending', () => {
            it('approves an intent', async () =>  {
              await approvals.approve(intentId, { from })

              const [state, executionScript] = await approvals.getIntent(intentId, { from })
              assert.equal(state.toString(), INTENT_STATE.APPROVED, 'intent state does not match')
              assert.equal(executionScript, script, 'intent execution script does not match')
            })

            it('emits an event', async () => {
              const receipt = await approvals.approve(intentId, { from })
              assertEvent(receipt, 'IntentApproved', { moderator, intentId })
            })

            it('executes the associated script', async () => {
              await approvals.approve(intentId, { from })
              assert.equal(await executionTarget.counter(), 1, 'the execution script has not received execution calls')
            })
          })

          context('when the given intent is was approved', () => {
            beforeEach('approve an intent', async () => {
              await approvals.approve(intentId, { from })
            })

            it('reverts', async () =>  {
              await assertRevert(approvals.approve(intentId, { from }), 'APPROVALS_INTENT_ALREADY_DECIDED')
            })
          })

          context('when the given intent is was rejected', () => {
            beforeEach('reject an intent', async () => {
              await approvals.reject(intentId, { from })
            })

            it('reverts', async () =>  {
              await assertRevert(approvals.approve(intentId, { from }), 'APPROVALS_INTENT_ALREADY_DECIDED')
            })
          })
        })

        context('when the sender is not allowed to submit intents', () => {
          const from = someone

          it('reverts', async () =>  {
            await assertRevert(approvals.approve(intentId, { from }), 'APP_AUTH_FAILED')
          })
        })
      })

      context('when the given intent does not exist', () => {
        const intentId = 0

        it('reverts', async () => {
          await assertRevert(approvals.approve(intentId, { from: moderator }), 'APPROVALS_INTENT_DOES_NOT_EXIST')
        })
      })
    })

    context('when it has not been initialized yet', function () {
      const intentId = 0

      it('reverts', async () => {
        await assertRevert(approvals.approve(intentId, { from: moderator }), 'APP_AUTH_FAILED')
      })
    })
  })

  describe('reject', () => {
    let executionTarget, script

    beforeEach('build script', async () => {
      executionTarget = await ExecutionTarget.new()
      const action = { to: executionTarget.address, calldata: executionTarget.contract.execute.getData() }
      script = encodeCallScript([action])
    })

    context('when the app has already been initialized', function () {
      beforeEach('initialize approvals app', async () => {
        await approvals.initialize()
      })

      context('when the given intent exists', () => {
        let intentId

        beforeEach('create an intent', async () => {
          const receipt = await approvals.submit(script, { from: user })
          intentId = getEventArgument(receipt, 'IntentSubmitted', 'intentId')
        })

        context('when the sender is allowed to reject intents', () => {
          const from = moderator

          context('when the given intent is pending', () => {
            it('rejects an intent', async () =>  {
              await approvals.reject(intentId, { from })

              const [state, executionScript] = await approvals.getIntent(intentId, { from })
              assert.equal(state.toString(), INTENT_STATE.REJECTED, 'intent state does not match')
              assert.equal(executionScript, script, 'intent execution script does not match')
            })

            it('emits an event', async () => {
              const receipt = await approvals.reject(intentId, { from })
              assertEvent(receipt, 'IntentRejected', { moderator, intentId })
            })

            it('does not execute the associated script', async () => {
              await approvals.reject(intentId, { from })
              assert.equal(await executionTarget.counter(), 0, 'the execution script has received execution calls')
            })
          })

          context('when the given intent is was approved', () => {
            beforeEach('approve an intent', async () => {
              await approvals.approve(intentId, { from })
            })

            it('reverts', async () =>  {
              await assertRevert(approvals.reject(intentId, { from }), 'APPROVALS_INTENT_ALREADY_DECIDED')
            })
          })

          context('when the given intent is was rejected', () => {
            beforeEach('reject an intent', async () => {
              await approvals.reject(intentId, { from })
            })

            it('reverts', async () =>  {
              await assertRevert(approvals.reject(intentId, { from }), 'APPROVALS_INTENT_ALREADY_DECIDED')
            })
          })
        })

        context('when the sender is not allowed to submit intents', () => {
          const from = someone

          it('reverts', async () =>  {
            await assertRevert(approvals.reject(intentId, { from }), 'APP_AUTH_FAILED')
          })
        })
      })

      context('when the given intent does not exist', () => {
        const intentId = 0

        it('reverts', async () => {
          await assertRevert(approvals.reject(intentId, { from: moderator }), 'APPROVALS_INTENT_DOES_NOT_EXIST')
        })
      })
    })

    context('when it has not been initialized yet', function () {
      const intentId = 0

      it('reverts', async () => {
        await assertRevert(approvals.reject(intentId, { from: moderator }), 'APP_AUTH_FAILED')
      })
    })
  })

  describe('isForwarder', () => {
    context('when the app has already been initialized', function () {
      beforeEach('initialize approvals app', async () => {
        await approvals.initialize()
      })

      it('returns true', async () => {
        assert.isTrue(await approvals.isForwarder(), 'should be a forwarder')
      })
    })

    context('when it has not been initialized yet', function () {
      it('returns true', async () => {
        assert.isTrue(await approvals.isForwarder(), 'should be a forwarder')
      })
    })
  })

  describe('canForward', () => {
    context('when the app has already been initialized', function () {
      beforeEach('initialize approvals app', async () => {
        await approvals.initialize()
      })

      context('when the sender is allowed to submit intents', () => {
        const sender = user

        it('returns true', async () =>  {
          assert.isTrue(await approvals.canForward(sender, '0x'), 'sender should be able to forward')
        })
      })

      context('when the sender is not allowed to submit intents', () => {
        const sender = someone

        it('returns false', async () =>  {
          assert.isFalse(await approvals.canForward(sender, '0x'), 'sender should not be able to forward')
        })
      })
    })

    context('when it has not been initialized yet', function () {
      context('when the sender is allowed to submit intents', () => {
        const sender = user

        it('returns false', async () =>  {
          assert.isFalse(await approvals.canForward(sender, '0x'), 'sender should be able to forward')
        })
      })

      context('when the sender is not allowed to submit intents', () => {
        const sender = someone

        it('returns false', async () =>  {
          assert.isFalse(await approvals.canForward(sender, '0x'), 'sender should not be able to forward')
        })
      })
    })
  })

  describe('forward', () => {
    let executionTarget, script

    beforeEach('build script', async () => {
      executionTarget = await ExecutionTarget.new()
      const action = { to: executionTarget.address, calldata: executionTarget.contract.execute.getData() }
      script = encodeCallScript([action])
    })

    context('when the app has already been initialized', function () {
      beforeEach('initialize approvals app', async () => {
        await approvals.initialize()
      })

      context('when the sender is allowed to submit intents', () => {
        let intentId
        const from = user

        beforeEach('forward intent', async () => {
          const receipt = await approvals.forward(script, { from })
          assertEvent(receipt, 'IntentSubmitted', { submitter: user, intentId: 0 })
          intentId = getEventArgument(receipt, 'IntentSubmitted', 'intentId')
        })

        it('creates an intent', async () =>  {
          const [state, executionScript] = await approvals.getIntent(intentId)
          assert.equal(state.toString(), INTENT_STATE.PENDING, 'intent state does not match')
          assert.equal(executionScript, script, 'intent execution script does not match')
        })

        it('can be executed', async () => {
          await approvals.approve(intentId, { from: moderator })
          assert.equal(await executionTarget.counter(), 1, 'the execution script has not received execution calls')
        })

        it('can be rejected', async () => {
          await approvals.reject(intentId, { from: moderator })
          assert.equal(await executionTarget.counter(), 0, 'the execution script has received execution calls')
        })
      })

      context('when the sender is not allowed to submit intents', () => {
        const from = someone

        it('reverts', async () =>  {
          await assertRevert(approvals.forward(script, { from }), 'APPROVALS_CAN_NOT_FORWARD')
        })
      })
    })

    context('when it has not been initialized yet', function () {
      context('when the sender is allowed to submit intents', () => {
        const from = user

        it('reverts', async () => {
          await assertRevert(approvals.forward(script, { from }), 'APPROVALS_CAN_NOT_FORWARD')
        })
      })
      context('when the sender is not allowed to submit intents', () => {
        const from = someone

        it('reverts', async () => {
          await assertRevert(approvals.forward(script, { from }), 'APPROVALS_CAN_NOT_FORWARD')
        })
      })
    })
  })
})

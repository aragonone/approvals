/*
 * SPDX-License-Identitifer:    GPL-3.0-or-later
 *
 * This file requires contract dependencies which are licensed as
 * GPL-3.0-or-later, forcing it to also be licensed as such.
 *
 * This is the only file in your project that requires this license and
 * you are free to choose a different license for the rest of the project.
 */

pragma solidity 0.4.24;

import "../../Approvals.sol";
import "@aragon/os/contracts/apm/Repo.sol";
import "@aragon/os/contracts/apm/APMNamehash.sol";
import "@aragon/os/contracts/factory/DAOFactory.sol";
import "@aragon/os/contracts/lib/ens/ENS.sol";
import "@aragon/os/contracts/lib/token/ERC20.sol";
import "@aragon/os/contracts/lib/ens/PublicResolver.sol";
import "@aragon/apps-voting/contracts/Voting.sol";
import "@aragon/apps-token-manager/contracts/TokenManager.sol";
import "@aragon/apps-shared-minime/contracts/MiniMeToken.sol";


contract ApprovalsKit is APMNamehash {
    uint64 internal constant PCT = 10 ** 16;
    address internal constant ANY_ENTITY = address(-1);

    bytes32 internal VOTING_APP_ID = apmNamehash("voting");
    bytes32 internal APPROVALS_APP_ID = apmNamehash("approvals");
    bytes32 internal TOKEN_MANAGER_APP_ID = apmNamehash("token-manager");

    ENS public ens;
    DAOFactory public daoFactory;
    MiniMeTokenFactory public miniMeTokenFactory;

    event DeployInstance(address dao);
    event InstalledApp(address appProxy, bytes32 appId);

    constructor(ENS _ens) public {
        ens = _ens;
        bytes32 bareKit = apmNamehash("bare-kit");
        daoFactory = ApprovalsKit(latestVersionAppBase(bareKit)).daoFactory();
        miniMeTokenFactory = new MiniMeTokenFactory();
    }

    function newInstance() public {
        address root = msg.sender;
        Kernel dao = daoFactory.newDAO(this);
        ACL acl = ACL(dao.acl());
        acl.createPermission(this, dao, dao.APP_MANAGER_ROLE(), this);

        Voting voting1 = Voting(installApp(dao, VOTING_APP_ID));
        Voting voting2 = Voting(installApp(dao, VOTING_APP_ID));
        Voting voting3 = Voting(installApp(dao, VOTING_APP_ID));
        Approvals approvals = Approvals(installApp(dao, APPROVALS_APP_ID));
        TokenManager tokenManager = TokenManager(installApp(dao, TOKEN_MANAGER_APP_ID));

        MiniMeToken token = miniMeTokenFactory.createCloneToken(MiniMeToken(0), 0, "Approvals DAO Token", 18, "ADP", true);
        token.changeController(tokenManager);

        voting1.initialize(token, 50 * PCT, 0, 1 days);
        voting2.initialize(token, 50 * PCT, 0, 1 days);
        voting3.initialize(token, 50 * PCT, 0, 1 days);
        approvals.initialize();
        tokenManager.initialize(token, true, 0);

        acl.createPermission(approvals, voting1, voting1.CREATE_VOTES_ROLE(), root);
        acl.createPermission(ANY_ENTITY, voting2, voting2.CREATE_VOTES_ROLE(), root);
        acl.createPermission(voting2, voting3, voting3.CREATE_VOTES_ROLE(), root);

        acl.createPermission(ANY_ENTITY, approvals, approvals.SUBMIT_ROLE(), root);
        acl.createPermission(root, approvals, approvals.APPROVE_ROLE(), root);
        acl.createPermission(root, approvals, approvals.REJECT_ROLE(), root);

        acl.createPermission(this, tokenManager, tokenManager.MINT_ROLE(), this);
        tokenManager.mint(root, 1e18);
        acl.grantPermission(voting1, tokenManager, tokenManager.MINT_ROLE());
        acl.grantPermission(voting2, tokenManager, tokenManager.MINT_ROLE());
        acl.grantPermission(voting3, tokenManager, tokenManager.MINT_ROLE());
        acl.revokePermission(this, tokenManager, tokenManager.MINT_ROLE());
        acl.setPermissionManager(root, tokenManager, tokenManager.MINT_ROLE());

        acl.grantPermission(root, dao, dao.APP_MANAGER_ROLE());
        acl.revokePermission(this, dao, dao.APP_MANAGER_ROLE());
        acl.setPermissionManager(root, dao, dao.APP_MANAGER_ROLE());

        acl.grantPermission(root, acl, acl.CREATE_PERMISSIONS_ROLE());
        acl.revokePermission(this, acl, acl.CREATE_PERMISSIONS_ROLE());
        acl.setPermissionManager(root, acl, acl.CREATE_PERMISSIONS_ROLE());

        emit DeployInstance(dao);
    }

    function installApp(Kernel dao, bytes32 appId) internal returns (address) {
        return address (dao.newAppInstance(appId, latestVersionAppBase(appId)));
    }

    function latestVersionAppBase(bytes32 appId) internal view returns (address) {
        Repo repo = Repo(PublicResolver(ens.resolver(appId)).addr(appId));
        (,address base,) = repo.getLatest();
        return base;
    }
}

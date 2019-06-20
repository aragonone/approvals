/*
 * SPDX-License-Identitifer:    GPL-3.0-or-later
 */

pragma solidity 0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/os/contracts/common/IForwarder.sol";


contract Approvals is IForwarder, AragonApp {
    bytes32 public constant SUBMIT_ROLE = keccak256("SUBMIT_ROLE");
    bytes32 public constant APPROVE_ROLE = keccak256("APPROVE_ROLE");
    bytes32 public constant REJECT_ROLE = keccak256("REJECT_ROLE");

    string private constant ERROR_CAN_NOT_FORWARD = "APPROVALS_CAN_NOT_FORWARD";
    string private constant ERROR_INTENT_DOES_NOT_EXIST = "APPROVALS_INTENT_DOES_NOT_EXIST";
    string private constant ERROR_INTENT_ALREADY_DECIDED = "APPROVALS_INTENT_ALREADY_DECIDED";

    enum IntentState { Pending, Approved, Rejected }

    struct Intent {
        IntentState state;
        bytes executionScript;
    }

    uint256 internal nextIntent;
    mapping (uint256 => Intent) internal intents;

    event IntentSubmitted(uint256 indexed intentId, address indexed submitter);
    event IntentApproved(uint256 indexed intentId, address indexed moderator);
    event IntentRejected(uint256 indexed intentId, address indexed moderator);

    modifier intentPending(uint256 intentId) {
        require(_intentExists(intentId), ERROR_INTENT_DOES_NOT_EXIST);
        require(intents[intentId].state == IntentState.Pending, ERROR_INTENT_ALREADY_DECIDED);
        _;
    }

    modifier intentExists(uint256 intentId) {
        require(_intentExists(intentId), ERROR_INTENT_DOES_NOT_EXIST);
        _;
    }

    /**
    * @notice Initialize Approvals app
    */
    function initialize() external onlyInit {
        initialized();
    }

    /**
    * @notice Submit a new intent
    * @param script Script that will be executed in case the given intent gets approved
    */
    function submit(bytes script) external auth(SUBMIT_ROLE) {
        _submit(script);
    }

    /**
    * @notice Approve intent #`intentId`
    * @param intentId Intent identification number
    */
    function approve(uint256 intentId) external auth(APPROVE_ROLE) intentPending(intentId) {
        _approve(intentId);
    }

    /**
    * @notice Reject intent #`intentId`
    * @param intentId Intent identification number
    */
    function reject(uint256 intentId) external auth(REJECT_ROLE) intentPending(intentId) {
        _reject(intentId);
    }

    /**
    * @notice Tells whether the Approvals app is a forwarder or not
    * @dev IForwarder interface conformance
    * @return Always true
    */
    function isForwarder() external pure returns (bool) {
        return true;
    }

    /**
    * @notice Creates an intent to execute a desired action
    * @dev IForwarder interface conformance
    * @param script Script that will be executed in case the associated intent gets approved
    */
    function forward(bytes script) public {
        require(canForward(msg.sender, script), ERROR_CAN_NOT_FORWARD);
        _submit(script);
    }

    /**
    * @notice Tells whether `_sender` can forward actions or not
    * @dev IForwarder interface conformance
    * @param sender Address of the account intending to forward an action
    * @return True if the given address can submit intents, false otherwise
    */
    function canForward(address sender, bytes) public view returns (bool) {
        // Note that `canPerform()` implicitly does an initialization check itself
        return canPerform(sender, SUBMIT_ROLE, arr());
    }

    /**
    * @dev Return the information for an intent by its ID
    * @param intentId Intent identification number
    * @return Intent state
    * @return Intent execution script
    */
    function getIntent(uint256 intentId) public view intentExists(intentId) returns (IntentState, bytes) {
        Intent storage intent = intents[intentId];
        return (intent.state, intent.executionScript);
    }

    function _submit(bytes script) internal {
        emit IntentSubmitted(nextIntent, msg.sender);
        intents[nextIntent++] = Intent({ state: IntentState.Pending, executionScript: script });
    }

    function _approve(uint256 intentId) internal {
        Intent storage intent = intents[intentId];
        intent.state = IntentState.Approved;
        runScript(intent.executionScript, new bytes(0), new address[](0));
        emit IntentApproved(intentId, msg.sender);
    }

    function _reject(uint256 intentId) internal {
        intents[intentId].state = IntentState.Rejected;
        emit IntentRejected(intentId, msg.sender);
    }

    function _intentExists(uint256 intentId) internal view returns (bool) {
        return intentId < nextIntent;
    }
}

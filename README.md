# Approvals App

A simple Aragon App that allows people to submit intents based on a role, and forward intents after they 
are approved, or drop intents if rejected. Useful for when an organization wants to allow people to submit their 
desired actions publicly, while having a curation stage as well.

For example, we could use this app to improve our AGP process by allowing AGPs to be submitted in Aragon and have 
the Association review process happen on chain. 

## 🚨 Not yet audited, use at your own risk

The `Approvals` contract has not yet been professionally audited. It is simple, but use with this
asterisk in mind.

## Functionality

### Initialization

It doesn't require initialization parameters

### Submit

The `submit` function allows create a new intent. This function is protected by the `SUBMIT_ROLE` role.
This functionality can also be used through the forwarding interface.

### Approve

The `approve` function allows a moderator to approve a pending intent. 
This function is protected by the `APPROVE_ROLE` role.

### Reject

The `reject` function allows a moderator to reject a pending intent. 
This function is protected by the `REJECT_ROLE` role.

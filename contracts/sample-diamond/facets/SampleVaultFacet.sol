// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SampleVaultFacet {
    struct VaultStorage {
        mapping(address => uint256) balances;
        uint256 totalDeposited;
        bool isPaused;
    }

    bytes32 constant VAULT_STORAGE_POSITION = keccak256("diamond.sample.vault.storage");

    function vaultStorage() internal pure returns (VaultStorage storage vs) {
        bytes32 position = VAULT_STORAGE_POSITION;
        assembly {
            vs.slot := position
        }
    }

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    function deposit() external payable {
        require(!vaultStorage().isPaused, "Vault is paused");
        vaultStorage().balances[msg.sender] += msg.value;
        vaultStorage().totalDeposited += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external {
        require(vaultStorage().balances[msg.sender] >= amount, "Insufficient balance");
        vaultStorage().balances[msg.sender] -= amount;
        vaultStorage().totalDeposited -= amount;
        payable(msg.sender).transfer(amount);
        emit Withdrawn(msg.sender, amount);
    }

    function getVaultBalance(address user) external view returns (uint256) {
        return vaultStorage().balances[user];
    }

    function getTotalDeposited() external view returns (uint256) {
        return vaultStorage().totalDeposited;
    }

    function isVaultPaused() external view returns (bool) {
        return vaultStorage().isPaused;
    }
}


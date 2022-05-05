// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SGold is ERC20PresetMinterPauser {
    event NewTaxRecipient(address recipient);
    event NewTax(uint base, uint rate);

    bytes32 public constant TAXER_ROLE = keccak256("TAXER_ROLE");
    uint public constant TAX_RATE_UNIT = 1000000;

    uint taxBase;
    uint taxRate;
    address taxRecipient;

    constructor() ERC20PresetMinterPauser("Stable Gold", "SGOLD") {
        taxRecipient = _msgSender();
        emit NewTaxRecipient(taxRecipient);
    }

    function setTaxRecipient(address recipient) external {
        require(hasRole(TAXER_ROLE, _msgSender()), "SGold: !taxer");
        taxRecipient = recipient;
        emit NewTaxRecipient(recipient);
    }

    function setTax(uint base, uint rate) external {
        require(hasRole(TAXER_ROLE, _msgSender()), "SGold: !taxer");
        taxBase = base;
        taxRate = rate;
        emit NewTax(base, rate);
    }

    /**
     * @dev See {IERC20-transfer}.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - the caller must have a balance of at least `amount`.
     */
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        address owner = _msgSender();
        _transferTaxed(owner, to, amount);
        return true;
    }

    /**
     * @dev See {IERC20-transferFrom}.
     *
     * Emits an {Approval} event indicating the updated allowance. This is not
     * required by the EIP. See the note at the beginning of {ERC20}.
     *
     * NOTE: Does not update the allowance if the current allowance
     * is the maximum `uint256`.
     *
     * Requirements:
     *
     * - `from` and `to` cannot be the zero address.
     * - `from` must have a balance of at least `amount`.
     * - the caller must have allowance for ``from``'s tokens of at least
     * `amount`.
     */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        _transferTaxed(from, to, amount);
        return true;
    }

    function _transferTaxed(
        address from,
        address to,
        uint amount
    ) internal {
        uint tax = taxBase + amount * taxRate / TAX_RATE_UNIT;
        _transfer(from, taxRecipient, tax);
        _transfer(from, to, amount - tax);
    }
}

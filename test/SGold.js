const assert = require('assert');

const SGold = artifacts.require("SGold");
const TAX_RATE_UNIT = 1000000
const TAX_ROLE = '0x2fda9f86653a6f94edb36dd5dbdedb0b4f3ef7ab689f142edef1dc0fadb46b8a';

contract("transfer", async accounts => {
  let sgold;
  it("transfer without setting tax", async () => {
    const accountOne = accounts[0];
    const accountTwo = accounts[1];

    sgold = await SGold.deployed();

    await sgold.mint(accountOne, 150)

    // Balance after minting should be 150
    const balance = await sgold.balanceOf.call(accountOne);
    assert.equal(balance.valueOf(), 150);


    // Transfer to accountTwo 50 sgold
    await sgold.transfer(accountTwo, 50)

    const balanceOneAfter = await sgold.balanceOf.call(accountOne);
    const balanceTwoAfter = await sgold.balanceOf.call(accountTwo);

    assert.equal(balanceOneAfter.valueOf(), 100);
    assert.equal(balanceTwoAfter.valueOf(), 50);

  });

  it("transfer with tax is set: overflow", async () => {

    const accountOne = accounts[0];
    const accountTwo = accounts[1];

    await sgold.grantRole(TAX_ROLE, accountOne)
    await sgold.setTax(2, 30000)

    await assert.rejects(
      sgold.transfer(accountTwo, 1, {from: accountOne}),
      { reason: 'SGold: overflow' },
    );

  });


  it("success", async () => {
    const accountOne = accounts[0];
    const accountTwo = accounts[3];
    const accountThree = accounts[4];

    const balance = await sgold.balanceOf.call(accountOne);
    assert.equal(balance.valueOf(), 100);


    await sgold.grantRole(TAX_ROLE, accounts[0])

    await sgold.setTaxRecipient(accountThree)

    const taxBase = 2;
    const taxRate = 30000;
    await sgold.setTax(taxBase, taxRate)

    await sgold.transfer(accountTwo, 40, { from: accountOne });

    const balanceOneAfter = await sgold.balanceOf.call(accountOne);
    assert.equal(balanceOneAfter.valueOf(), 100 - 40);

    const tax = Math.round(taxBase + 40 * taxRate / TAX_RATE_UNIT);

    const balanceTwoAfter = await sgold.balanceOf.call(accountTwo);
    assert.equal(balanceTwoAfter.valueOf(), 40 - tax);

    const balanceThreeAfter = await sgold.balanceOf.call(accountThree);
    assert.equal(balanceThreeAfter.valueOf(), tax);
  });


});


contract("transferFrom", async accounts => {

  it("success", async () => {
    const accountOne = accounts[0];
    const accountTwo = accounts[1];
    const accountThree = accounts[2];
    const accountFour = accounts[3];

    const sgold = await SGold.deployed();

    await sgold.mint(accountOne, 100, { from: accountOne })

    const balance = await sgold.balanceOf.call(accountOne);
    assert.equal(balance.valueOf(), 100);

    await sgold.grantRole(TAX_ROLE, accounts[0])

    await sgold.setTaxRecipient(accountThree)

    const taxBase = 2;
    const taxRate = 30000;
    await sgold.setTax(taxBase, taxRate)

    await sgold.approve(accountTwo, 50, { from: accountOne });
    allowance = await sgold.allowance(accountOne, accountTwo);
    assert.equal(allowance.valueOf(), 50);

    await sgold.transferFrom(accountOne, accountFour, 40, { from: accountTwo })

    const tax = Math.round(taxBase + 40 * taxRate / TAX_RATE_UNIT);

    const balanceOneAfter = await sgold.balanceOf.call(accountOne);
    assert.equal(balanceOneAfter.valueOf(), 100 - 40);

    const balanceTwoAfter = await sgold.balanceOf.call(accountTwo);
    assert.equal(balanceTwoAfter.valueOf(), 0);

    const balanceThreeAfter = await sgold.balanceOf.call(accountThree);
    assert.equal(balanceThreeAfter.valueOf(), tax);

    const balanceFourAfter = await sgold.balanceOf.call(accountFour);
    assert.equal(balanceFourAfter.valueOf(), 40 - tax);

  });

});











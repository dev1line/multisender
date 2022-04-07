const chai = require("chai");
const { expect } = require("chai");
const { solidity } = require("ethereum-waffle");
const { waffle} = require("hardhat");
const provider = waffle.provider;
const { add, subtract, multiply, divide } = require("js-big-decimal");
chai.use(solidity);

describe("Testcase of Multisender: ", () => {
    let Multisender, multisender, Token, token, owner, addr1, addr2;
    beforeEach(async () => {
        [owner, addr1, addr2] = await ethers.getSigners();

        Token = await ethers.getContractFactory("Token");
        token = await Token.connect(owner).deploy("Test Coin", "TEST");
        await token.deployed();  

        Multisender = await ethers.getContractFactory("Multisender");
        multisender = await Multisender.deploy();
        await multisender.deployed();   
    });

    describe("Deployment", async () => {
        it("should be deployed with correct token and ticket", async () => {
            expect(await token.name()).to.equal("Test Coin");
            expect(await token.symbol()).to.equal("TEST");
        });
        it("should be deployed with correct const variable", async () => {
          expect(await multisender.owner()).to.equal(owner.address);
          expect(await multisender.limit_contributors()).to.equal(150);
        });
    });

    describe("1. Function MultisendToken", async () => {
        it("should be revert when amount of contributors more than limit of contributors ", async () => {
            const array150address = Array.from({length: 150}, () => {
                return addr1.address;
            });
            const array150value = Array.from({length: 150}, () => {
                return "100000000000000";
            });
          
            await expect(multisender.connect(owner)
            .multisendToken(token.address, array150address, array150value))
            .to.be.revertedWith("You not approve your token !")
        });
        it("should be revert when amount of contributors more than limit of contributors ", async () => {
            const array151address = Array.from({length: 151}, () => {
                return addr1.address;
            });
            const array151value = Array.from({length: 151}, () => {
                return "100000000000000";
            });
           await token.connect(owner).approve(multisender.address, "1999000000000000000000");
            await expect(multisender.connect(owner)
            .multisendToken(token.address, array151address, array151value))
            .to.be.revertedWith("a mount of contributors over limit !")
        });
        it("should be revert when allowance not enough token for send ", async () => {
            const array150address = Array.from({length: 150}, () => {
                return addr1.address;
            });
            const array150value = Array.from({length: 150}, () => {
                return "10000000000000000";
            });
            // await multisender.approve(token.address, "220000000000000000");
            await token.connect(owner).approve(multisender.address, "10000000000000000");
            await expect(multisender.connect(owner)
            .multisendToken(token.address, array150address, array150value))
            .to.be.revertedWith("not enough token for send !")
        });
        it("should be send success", async () => {
            const array150address = Array.from({length: 150}, () => {
                return addr1.address;
            });
            const array150value = Array.from({length: 150}, () => {
                return "10000000000000000";
            });
        
           await token.connect(owner).approve(multisender.address, "1600000000000000000");
           await multisender.approve(token.address, "1600000000000000000");
            const tx = await multisender.connect(owner)
            .multisendToken(token.address, array150address, array150value);
            await tx.wait();

            expect(await token.balanceOf(addr1.address)).to.equal("1500000000000000000");
        });
        it("should be send fee when allowance > total + 1/200 of total", async () => {
            const array150address = Array.from({length: 150}, () => {
                return addr1.address;
            });
            const array150value = Array.from({length: 150}, () => {
                return "10000000000000000";
            });
  
           await token.connect(owner).approve(multisender.address, "2000000000000000000");
           await multisender.approve(token.address, "2000000000000000000");
            const tx = await multisender.connect(owner)
            .multisendToken(token.address, array150address, array150value);
            await tx.wait();

            expect(await token.balanceOf(addr1.address)).to.equal("1500000000000000000");
            expect(await token.balanceOf(multisender.address)).to.equal(multiply("1500000000000000000", divide(1, 200)));
        });
    });

    describe("2. Function MultisendEther", async () => {
        it("should be revert when amount of contributors more than limit of contributors ", async () => {
            const array151address = Array.from({length: 151}, () => {
                return addr1.address;
            });
            const array151value = Array.from({length: 151}, () => {
                return "100000000000000";
            });
     
            await expect(multisender.connect(owner)
            .multisendEther(array151address, array151value, {value: "100000000000000"}))
            .to.be.revertedWith("a mount of contributors over limit !")
        });
        it("should be revert when not enough ether for send ", async () => {
            const array151address = Array.from({length: 151}, () => {
                return addr1.address;
            });
            const array151value = Array.from({length: 151}, () => {
                return "100000000000000";
            });
     
            await expect(multisender.connect(owner)
            .multisendEther(array151address, array151value, {value: "16000000000000000"}))
            .to.be.revertedWith("a mount of contributors over limit !")
        });
        it("should be send success", async () => {
            const amountBefore = await provider.getBalance(addr1.address);
            const array150address = Array.from({length: 150}, () => {
                return addr1.address;
            });
            const array150value = Array.from({length: 150}, () => {
                return "100000000000000";
            });
     
            await expect(() =>  multisender.connect(owner)
            .multisendEther(array150address, array150value, {value: "15000000000000000"}))
            .to.changeEtherBalances([owner, addr1], ["-15000000000000000", "15000000000000000"]);
            // const tx = await multisender.connect(owner)
            // .multisendEther(array150address, array150value, {value: "15000000000000000"})
            // await tx.wait();
            // const balanceaddr1 = await provider.getBalance(addr1.address)
            // expect(ethers.BigNumber.from(balanceaddr1 ).toString()).to.equal(add("10000000000000000000000", "15000000000000000").toString());
            // expect(await provider.getBalance(owner.address)).to.equal("18490000000000000000");
        });
       
        it("should be send fee when msg.value > total ", async () => {
            // const amountBefore = await provider.getBalance(addr2.address);
            const array150address = Array.from({length: 150}, () => {
                return addr2.address;
            });
            const array150value = Array.from({length: 150}, () => {
                return "100000000000000";
            });
     
            // const tx = await multisender.connect(owner)
            // .multisendEther(array150address, array150value, {value: "20000000000000000"})
            // await tx.wait();
            // const balanceaddr2 = await provider.getBalance(addr2.address)
            // expect(ethers.BigNumber.from(balanceaddr2 ).toString()).to.equal(add("10000000000000000000000", "15000000000000000"));

            await expect(() =>  multisender.connect(owner)
            .multisendEther(array150address, array150value, {value: "20000000000000000"}))
            .to.changeEtherBalances([owner, addr2], ["-20000000000000000", "15000000000000000"]);
            // -subtract(ethers.BigNumber.from("15000000000000000"),multiply("15000000000000000"), divide(1, 200)) , "15000000000000000"
            // expect(await provider.getBalance(owner.address)).to.equal(subtract("18490000000000000000",multiply("15000000000000000", divide(1, 200))));
            // expect(await provider.getBalance(multisender.address)).to.equal(multiply("15000000000000000", divide(1, 200)));
        });  
    });

    describe("3. Function claimTokens", async () => {
        it("should be revert when balance = 0", async () => {
              await expect(multisender.connect(owner)
            .claimTokens(token.address))
            .to.be.revertedWith("not have token for claim !")
        });
        it("should be send success", async () => {
            const array150address = Array.from({length: 150}, () => {
                return addr1.address;
            });
            const array150value = Array.from({length: 150}, () => {
                return "10000000000000000";
            });
  
           await token.connect(owner).approve(multisender.address, "2000000000000000000");
           await multisender.approve(token.address, "2000000000000000000");
            const tx = await multisender.connect(owner)
            .multisendToken(token.address, array150address, array150value);
            await tx.wait();
            const contractBalance = await multisender.connect(owner)
            .claimTokens(token.address);
            const realBalance = await token.balanceOf(multisender.address);
            // console.log("contractBalance", contractBalance.value)
            // console.log("realBalance", realBalance)
             expect(ethers.BigNumber.from(contractBalance.value).toString())
            .to.equal(ethers.BigNumber.from(realBalance).toString());
        });
    });

    describe("4. Function claimNative", async () => {
        it("should be revert when balance = 0", async () => {
            await expect(multisender.connect(owner)
            .claimNative())
            .to.be.revertedWith("not have ether for claim !")
        });
        it("should be send success", async () => {
            const array150address = Array.from({length: 150}, () => {
                return addr2.address;
            });
            const array150value = Array.from({length: 150}, () => {
                return "100000000000000";
            });
            const tx = await multisender.connect(owner)
            .multisendEther(array150address, array150value, {value: "20000000000000000"})
            await tx.wait();
            const balanceContract = await multisender.connect(owner)
            .claimNative();
            const realBalance = await provider.getBalance(multisender.address);
            expect(ethers.BigNumber.from(balanceContract.value).toString())
            .to.equal(ethers.BigNumber.from(realBalance).toString());
        });
    });

    // describe("5. Event", async () => {
    //     it("should emit event Multisended when call multisendToken success", async () => {
          
    //     });
    //     it("should emit event Multisended when call multisendEther success", async () => {
          
    //     });
    //     it("should emit event ClaimedTokens when call claimTokens success", async () => {
          
    //     });
    //     it("should emit event ClaimedNative when call claimNative success", async () => {
          
    //     });
    // });
});
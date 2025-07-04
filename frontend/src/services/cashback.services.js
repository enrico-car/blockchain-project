import { ethers } from 'ethers'
import { Web3Provider } from '@ethersproject/providers'
import { loadContract } from '@/utils/abi.config'

const IS_CASHBACK_UPGRADED = true; 

//given from the cashbacktoken contract
const MIN_CASHBACK_AMOUNT = IS_CASHBACK_UPGRADED ? ethers.parseUnits('200', 18) : ethers.parseUnits('100', 18);

/**
 * Request the smart contract to redeem the cashback
 * based on the account that is making the request
 * @returns true if the redeem has been succesfull, false otherwise
 */
export async function redeemCashback() {
  try {
    const [tokenAbi, tokenAddress] = await loadContract('CashbackToken');
    const [handlerAbi, handlerAddress] = await loadContract('CashbackHandler');

    const provider = new Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    //approve CashbackHandler contract to spend MIN_CASHBACK_AMOUNT tokens on behalf of user
    const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);
    const approveTx = await tokenContract.approve(handlerAddress, MIN_CASHBACK_AMOUNT,{gasPrice: 0 });
    await approveTx.wait();
    console.log('Approval completed');

    //now call redeemCashback
    const handlerContract = new ethers.Contract(handlerAddress, handlerAbi, signer);
    const redeemTx = IS_CASHBACK_UPGRADED ? await handlerContract["redeemCashback(uint256)"](MIN_CASHBACK_AMOUNT,{gasPrice: 0 }) : await handlerContract["redeemCashback()"]({gasPrice: 0 });

    await redeemTx.wait();
    console.log('Redeemed cashback successfully');
    return true;
  } catch (error) {
    console.error('Error in approveAndRedeem:', error);
    return false;
  }
}

/**
 * Request the amount of tokens in your wallet
 * @returns a positive amount if the request goes well otherwise return -1
 */
export async function getTokenBalance(){
    try {
        const [abi, address] = await loadContract('CashbackToken');

        const provider = new Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        const contract = new ethers.Contract(address, abi, signer);

        const rawBalance = await contract.balanceOf(signer, {gasPrice: 0 });
        const balance = ethers.formatUnits(rawBalance, 18);
        
        return balance;
    } catch (error) {
        console.log("Not possible to obtain cashback balance", error);
        return -1;
    }
}

/**
 * Set the new reward multiplier for the cashback after a purchase
 * @param {*} value the percentage in range [0, 100]
 * @returns true if everything is ok, false otherwise
 */
export async function setRewardMultiplier(value){
    try {
        if(value < 0 || value > 100) {console.log("Multiplier must be lower than 100% and greater than 0%"); return false;}
        
        value = value * 100; //in order to account for decimal values

        const [abi, address] = await loadContract('TransactionManager');

        const provider = new Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        const contract = new ethers.Contract(address, abi, signer);

        //round value as smart contract allows only for int values
        //this is useful when the user insert more than 2 decimal digits
        //and we need to pass an unsigned value
        const tx = await contract.setRewardMultiplier(Math.round(value), {gasPrice: 0 });
        await tx.wait();

        console.log("New reward multiplier set!");

        return true;
    } catch (error) {
        console.log("Not possible to change reward multiplier", error);
        return false;
    }
}

/**
 * Request the value of the reward multiplier
 * @returns a positive amount if the request goes well otherwise return -1
 */
export async function getRewardMultiplier(){
        try {
        const [abi, address] = await loadContract('TransactionManager');

        const provider = new Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        const contract = new ethers.Contract(address, abi, signer);

        const rawReward = await contract.rewardMultiplier({gasPrice: 0 });
        const reward = ethers.formatUnits(rawReward, 2);

        console.log("Reward multiplier retrieved!");

        return reward;
    } catch (error) {
        console.log("Not possible to retrieve reward multiplier", error);
        return -1;
    }
}
import { ethers } from 'ethers';
import abi from '../abi/pool/univ2/IPancakePair.json';

export function getPancakePoolContract(pancakePoolAddress: string, provider: ethers.Provider) {
    return new ethers.Contract(pancakePoolAddress, abi.abi, provider);
}



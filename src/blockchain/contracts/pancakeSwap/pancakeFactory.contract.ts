import { ethers } from 'ethers';
import abi from '../abi/pool/univ2/IPancakeFactory.json';

export function getPancakeFactoryContract(pancakeFactoryAddress: string, provider: ethers.Provider) {
    return new ethers.Contract(pancakeFactoryAddress, abi.abi, provider);
}


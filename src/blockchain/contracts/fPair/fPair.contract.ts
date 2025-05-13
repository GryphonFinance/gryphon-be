import { ethers } from 'ethers';
import abi from '../abi/fun/FPair.json';

export function getFPairContract(fPairAddress: string, provider: ethers.Provider) {
    return new ethers.Contract(fPairAddress, abi.abi, provider);
}



import { ethers } from 'ethers';
import abi from '../abi/fun/Bonding.json';

export function getBondingContract(bondingAddress: string, provider: ethers.Provider) {
    return new ethers.Contract(bondingAddress, abi.abi, provider);
}
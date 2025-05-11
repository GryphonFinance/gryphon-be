import { ethers } from 'ethers';
import abi from '../abi/fun/FRouter.json';

export function getFRouterContract(fRouterAddress: string, provider: ethers.Provider) {
    return new ethers.Contract(fRouterAddress, abi.abi, provider);
}



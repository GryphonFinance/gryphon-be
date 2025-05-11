import { ethers } from 'ethers';
import abi from '../abi/pool/univ2/IRouter.json';

export function getPancakeRouterContract(pancakeRouterAddress: string, provider: ethers.Provider) {
    return new ethers.Contract(pancakeRouterAddress, abi.abi, provider);
}



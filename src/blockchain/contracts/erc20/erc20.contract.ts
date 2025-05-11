import { ethers } from 'ethers';
import abi from '../abi/fun/FERC20.json';

/**
 * Creates an ethers.js contract instance for any ERC-20 token
 */
export function getErc20Contract(tokenAddress: string, provider: ethers.Provider) {
    return new ethers.Contract(tokenAddress, abi.abi, provider);
}

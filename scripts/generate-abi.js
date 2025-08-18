const fs = require('fs');
const path = require('path');

function generateTypeScriptABI(contractFile, outputFileName, contractName) {
  try {
    // Read the compiled artifact
    const actualContractName = contractName || contractFile;
    const artifactPath = path.join(__dirname, `../artifacts/contracts/${contractFile}.sol/${actualContractName}.json`);
    
    if (!fs.existsSync(artifactPath)) {
      console.error(`Artifact not found: ${artifactPath}`);
      return;
    }
    
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    const abi = artifact.abi;
    
    // Generate TypeScript content
    const tsContent = `import { Abi } from 'viem'

export const ${outputFileName.replace('.tsx', '')}_abi: Abi = ${JSON.stringify(abi, null, 2)}
`;
    
    // Write to frontend assets
    const outputPath = path.join(__dirname, `../frontend/src/assets/abi/${outputFileName}`);
    fs.writeFileSync(outputPath, tsContent);
    
    console.log(`✅ Generated ${outputFileName} from ${contractFile}.sol`);
  } catch (error) {
    console.error(`Error generating ABI for ${contractName}:`, error);
  }
}

// Generate ABIs for all contracts
// Note: The contract file is lBTC.sol but the contract name is lzrBTC
generateTypeScriptABI('lBTC', 'lzrBTC.tsx', 'lzrBTC');
generateTypeScriptABI('stakelBTC', 'stakelzrBTC.tsx', 'StakeLBTC');
generateTypeScriptABI('stakedBTCAdapter', 'stakeAdapter.tsx', 'StakeAdapter');

console.log('\nABIs generated successfully! They are now aligned with the latest contract code.');
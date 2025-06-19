/**
 * Automatically compiles all contracts in contractsDir.
 * Outputs ABI and bytecode in separate folders.
 */

const solc = require('solc');//if needed a specific version, install the corresponding one
const path = require('path');
const fs = require('fs');

const contractsDir = path.join(__dirname, 'contracts');//where all contracts are stored
const buildBinDir = path.join(__dirname, 'build/bin');//where to store the bin files
const buildAbiDir = path.join(__dirname, 'build/abi');//where to store the abi files

// Create output directories if they don't exist
fs.mkdirSync(buildAbiDir, { recursive: true });
fs.mkdirSync(buildBinDir, { recursive: true });

// Gather all Solidity files in the contracts directory
const contractFiles = fs.readdirSync(contractsDir).filter(file => file.endsWith('.sol'));

// Create compiler input
const sources = {};
contractFiles.forEach(file => {
	const fullPath = path.join(contractsDir, file);
	sources[`contracts/${file}`] = {
		content: fs.readFileSync(fullPath, 'utf8'),
	};
});

const input = {
	language: 'Solidity',
	sources: sources,
	settings: {
		outputSelection: {
			'*': {
				'*': ['abi', 'evm.bytecode'],
			},
		},
	},
};

// Compile all contracts
const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

/**
 * in the case some contracts uses the import notation '@' to use external
 * ones, this function will try to import such contract to execute the compilation
 */
function findImports(importPath) {
	try {
		const fullPath = path.resolve(__dirname, 'node_modules', importPath);
		const content = fs.readFileSync(fullPath, 'utf8');
		return { contents: content };
	} catch (err) {
		return { error: 'File not found: ' + importPath };
	}
}

// Process and save ABI and bytecode for each contract
for (const sourceFile in output.contracts) {
	const fileName = path.basename(sourceFile);
	if (!contractFiles.includes(fileName)) {
		// Skip files not in original input folder
        // This can happen with contracts that extend from others, generating
        // more abis than required
		continue;
	}

	for (const contractName in output.contracts[sourceFile]) {
		const contract = output.contracts[sourceFile][contractName];

		// Skip if bytecode is empty (e.g. abstract/interface contracts)
		const bytecode = contract.evm?.bytecode?.object?.trim();
		if (!bytecode || bytecode === '0x' || bytecode.length < 10) {
			console.warn(`⚠️ Skipping ${contractName}: no deployable bytecode.`);
			continue;
		}

		// Save ABI
		const abi = contract.abi;
		const abiPath = path.join(buildAbiDir, `${contractName}.json`);
		fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));

		// Save bytecode
		const binPath = path.join(buildBinDir, `${contractName}.bin`);
		fs.writeFileSync(binPath, bytecode);

		console.log(`✅ Compiled: ${contractName}`);
	}
}
const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const web3 = new Web3('http://127.0.0.1:8545/');//address of the blockchain
const binDir = path.join(__dirname, 'build/bin');//where to store the bin files
const abiDir = path.join(__dirname, 'build/abi');//where to store the abi files
const outputPath = path.join(__dirname, 'deployedContracts.json');//where to store the address of the contract

// Utility to prompt user
// this will be needed in the case a contract requires an input for the contstructor
function promptInput(query) {
	return new Promise((resolve) => {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		rl.question(query, (answer) => {
			rl.close();
			resolve(answer);
		});
	});
}

// Convert string input to typed values (basic heuristic)
function parseArgument(type, value) {
	if (type.startsWith('uint') || type.startsWith('int')) {
		return Number(value);
	} else if (type === 'bool') {
		return value.toLowerCase() === 'true';
	} else {
		return value; // treat as string or address
	}
}

/**
 * this function will simply deploy all contracts have been
 * compiled using compile.js script
 * 
 * in the case of missmatch between abi, address and construct parameters, the contract
 * will be simply skipped and not deployed
 */
async function deployAll() {
	const accounts = await web3.eth.getAccounts();
	const deployer = accounts[0];
	console.log('Using deployer account:', deployer);

	const deployedAddresses = {};

  const binFiles = fs.readdirSync(binDir).filter(file => file.endsWith('.bin'));
  
  for (const binFile of binFiles) {
    const contractName = path.basename(binFile, '.bin');

    // Ensure matching ABI exists
    const abiPath = path.join(abiDir, `${contractName}.json`);
    if (!fs.existsSync(abiPath)) {
      console.warn(`⚠️ Skipping ${contractName}: no matching ABI found.`);
      continue;
    }

    const bytecodePath = path.join(binDir, binFile);
    const bytecode = fs.readFileSync(bytecodePath, 'utf8').trim();

    if (!bytecode || bytecode === '0x' || bytecode.length < 10) {
      console.warn(`⚠️ Skipping ${contractName}: empty or invalid bytecode.`);
      continue;
    }

    const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
    const contract = new web3.eth.Contract(abi);
    contract.handleRevert = true;

    // Detect constructor inputs
    const constructorAbi = abi.find(x => x.type === 'constructor');
    const inputs = constructorAbi?.inputs || [];

    let constructorArgs = [];

    if (inputs.length > 0) {
      console.log(`\n⚠️ Constructor for ${contractName} requires the following arguments:`);

      for (const input of inputs) {
        const userInput = await promptInput(` - ${input.name} (${input.type}): `);
        constructorArgs.push(parseArgument(input.type, userInput));
      }
    }

		// Deploy contract
		const deployTx = contract.deploy({
			data: '0x' + bytecode,
			arguments: constructorArgs
		});

		try {
			const gas = await deployTx.estimateGas({ from: deployer });
			console.log(`Deploying ${contractName}...`);

			const instance = await deployTx.send({
				from: deployer,
				gas,
				gasPrice: '10000000000'
			});

			console.log(`✅ ${contractName} deployed at: ${instance.options.address}`);
			deployedAddresses[contractName] = instance.options.address;
		} catch (err) {
			console.error(`❌ Failed to deploy ${contractName}: ${err.message}`);
		}
	}

	fs.writeFileSync(outputPath, JSON.stringify(deployedAddresses, null, 2));
	console.log(`\n✅ All deployed contract addresses saved to ${outputPath}`);
}

deployAll();

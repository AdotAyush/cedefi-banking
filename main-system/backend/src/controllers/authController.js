const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
    });
};

exports.register = async (req, res) => {
    const { username, email } = req.body;

    try {
        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Generate Wallet (Identity)
        const wallet = ethers.Wallet.createRandom();
        const did = `did:cedefi:${wallet.address.toLowerCase()}`;
        const publicKey = wallet.signingKey.publicKey;

        // Create DID Document
        const didDocument = {
            "@context": "https://www.w3.org/ns/did/v1",
            "id": did,
            "verificationMethod": [{
                "id": `${did}#keys-1`,
                "type": "EcdsaSecp256k1VerificationKey2019",
                "controller": did,
                "publicKeyHex": publicKey
            }],
            "authentication": [`${did}#keys-1`]
        };

        // Simple Admin Logic: If username is 'admin', assign admin role
        const role = username.toLowerCase() === 'admin' ? 'admin' : 'user';

        user = await User.create({
            username,
            email,
            did,
            publicKey,
            didDocument,
            role
        });

        // Return Private Key ONLY ONCE upon registration
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            did: user.did,
            role: user.role,
            privateKey: wallet.privateKey, // CRITICAL: User must save this
            didDocument,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.login = async (req, res) => {
    const { privateKey } = req.body;

    try {
        if (!privateKey) {
            return res.status(400).json({ message: 'Private Key is required' });
        }

        let wallet;
        try {
            wallet = new ethers.Wallet(privateKey);
        } catch (e) {
            return res.status(401).json({ message: 'Invalid Private Key' });
        }

        const did = `did:cedefi:${wallet.address.toLowerCase()}`;
        const user = await User.findOne({ did });

        if (user) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                did: user.did,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Identity not found. Please register.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

import express from 'express';
import * as deliveryAgentsController from '../controllers/deliveryAgentsController.js';

const router = express.Router();

// Complete signup (create auth user + profile)
router.post('/signup', deliveryAgentsController.signupDeliveryAgent);

// Register new delivery agent
router.post('/register', deliveryAgentsController.registerDeliveryAgent);

// Get delivery agent by user ID
router.get('/profile/:userId', deliveryAgentsController.getDeliveryAgentProfile);

// Get all delivery agents (admin)
router.get('/', deliveryAgentsController.getAllDeliveryAgents);

// Update delivery agent status (admin)
router.patch('/:id/verify', deliveryAgentsController.verifyDeliveryAgent);

// Update delivery agent location
router.patch('/:userId/location', deliveryAgentsController.updateLocation);

// Update duty status
router.patch('/:userId/duty-status', deliveryAgentsController.updateDutyStatus);

export default router;


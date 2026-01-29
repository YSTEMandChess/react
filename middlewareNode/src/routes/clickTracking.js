/**
 * Click Tracking Routes
 * 
 * API endpoints for tracking user clicks and interactions.
 * Records clicks, views, and other user actions for analytics
 * 
 * Features: 
 * - Track individial click events
 * - Get click statistics (CTR, most clicked features)
 * - Get click heatmap data
 * - Get user engagement patterns
 */

const express = require('express');
const passport = require('passport');
const router = express.Router();
const clickTracking = require('../models/clickTracking');

/**
 * POST /clickTracking/track
 * 
 * Records a single click/interaction event.
 * Called from frontend whenever user clicks tracking elements
 * 
 * Request body:
 * - username: user's username
 * - page: current page(eg: "lessons", "home")
 * - element: what was clicked (eg: "start_lesson_btn")
 * - elementId: optional ID of specific item (eg: lesson ID)
 * - action: type of interaction
 * - metadata: additional context (optional)
 * - sessionId: current session ID (optional)
 * 
 * @access JWT authentication required
 */
router.post("/track", passport.authenticate('jwt'), async(req, res) => {
    try {
        const {username, page, element, elementId, action, metadata, sessionId} = req.body;

        //validat required fields 
        if (!username || !page || !element) {
            return res.status(400).json({error: "Missing required fields: username, page, element"});
        }

        //create click event
        const clickEvent = await clickTracking.create({
            username,
            page,
            element,
            elementId: elementId || null,
            action: action || 'click',
            timestamp: new Date(),
            metadata: metadata || {},
            sessionId: sessionId || null,
        });

        return res.status(201).json({
            message: "Click tracked successfully",
            eventId: clickEvent._id
        });
    } catch(error) {
        console.error("Error tracking click: ", error.message);
        res.status(500).json({error: "Server error"});
    }
})

/** 
 * POST /clickTracking/batch
 * 
 * Records multiple click events at once
 * Useful for batching clicks to reduct API calls
 * 
 * Request body:
 * - events: Array of click event objects
 * 
 * @access JWT authentication required
 */
router.post("/batch", passport.authenticate('jwt'), async(req, res) => {
    try {
        const {events} = req.body;

        if(!Array.isArray(events) || events.length)
    }
})

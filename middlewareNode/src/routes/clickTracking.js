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

        if(!Array.isArray(events) || events.length === 0) {
            return res.status(400).json({error: "Events must be a non-empty array"});
        }

        //add timestamp to eahc even if not present
        const eventsWtihTimestamps = events.map(event => ({
            ...event,
            timestamp: event.timestamp || new Date(),
        }));

        const clickEvents = await clickTracking.insertMany(eventsWithTimeStamps);

        return res.status(201).json ({
            message: "Clicks tracked successfully",
            count: clickEvents.length
        });
    } catch(error) {
        console.error("Error tracking batch clicks:", error.message);
        res.status(500).json({error: "Server error"});
    }
});

/**
 * GET /clickTracking/statistics
 * 
 * Get aggregate click statistics for a user
 * Show which features are most used, CTR, etc.
 * 
 * Query parameters:
 * - username: user's username
 * - startDate: start of the date range (optional)
 * - endDate: end of date range (optional)
 * - page: filter by specific page (optional)
 * 
 * @access JWT authentication required
 */
router.get("/statistics", passport.authenticate('jwt'), async(req, res) => {
    try {
        const {username, startDate, endDate, page} = req.query;

        if (!username) {
            return res.status(400).json({error: "Username is required"});
        }

        //build filters
        let filters = {username};

        if(startDate && endDate) {
            filters.timestamp = {
                $gte: new Date(startDate),
                $lt: new Date(endDate),
            }
        }

        if(page) {
            filters.page = page;
        }

        const clicks = await clickTracking.find(filters);

        //aggregate statistics
        const stats = {
            totalClicks: clicks.length,
            clicksByPage: {},
            clicksByElement: {},
            clicksByAction: {},
            mostClickedElements: {},
        };

        clicks.forEach(click => {
            //count by page
            if(!stats.clicksbyPage[click.page]) {
                stats.clicksByPage[click.page] = 0;
            }
            stats.clicksByPage[click.page]++;

            //count by element
            const elementKey = `${click.page}_${click.element}`;
            if(!stats.clicksByElement[elementKey]) {
                stats.clicksByElement[elementKey] = 0;
            }
            stats.clicksByElement[elementKey]++;

            //count by action type
            if(!stats.clicksByAction[click.action]) {
                stats.clicksByAction[click.action] = 0;
            }
            stats.clicksByAction[click.action]++;

            //track most clicked element
            if(!stats.mostClickedElements[click.element]){
                stats.mostClickedElements[click.element] = {
                    count: 0,
                    page: click.page,
                };
            }
            stats.mostClickedElements[click.element].count++;
        })

        //sort most clicked elements
        const sortedElements = Object.entries(stats.mostClickedElements)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 10) //top 10
            .map(([element, data]) => ({
                element, 
                count: data.count,
                page: data.page,
            }));
        stats.topElements = sortedElements;
        delete stats.mostClickedElements; //remove unsorted version

        return res.status(200).json(stats);
    } catch (error) {
        console.error("Error fetching click statistics:", error.message);
        res.status(500).json({error: "Server error"});
    }
});

/**
 * GET /clickTracking/ctr
 * 
 * Calculate Click-Through Rate (CTR) for specific features.
 * CTR = (click on element/total views of page) * 100
 * 
 * Query Parameters:
 * - username: user's username
 * - page: page to analyze
 * - element: specific element to calculate CTR for (optional)
 * - startDate, endDate: date range (optional)
 * 
 * @access JWT authentication required
 */
router.get("/ctr", passport.authenticate("jwt"), async(req, res) => {
    try {
        const {username, page, element, startDate, endDate} = req.query;

        if(!username || !page) {
            return res.status(400).json({error: "Username and page are required"});
        }

        let filters = {username, page};

        if(startDate && endDate) {
            filters.timestamp = {
                $gte: new Date(startDate),
                $lt: new Date(endDate),
            };
        }

        const events = await clickTracking.find(filters);

        //count page views (navigation/view actions)
        const pageViews = events.filter(e => 
            e.action === "view" || e.action === "navigation"
        ).length;

        //count clicks on specific element or all clickes
        const clicks = element
        ? events.filter(e => e.element === element && e.action === "click").length
        : events.filter(e => e.action === "click").length;

        const ctr = pageViews > 0 ? ((clicks/pageViews) * 100).toFixed(2) : 0;

        return res.status(200).json({
            page,
            element: element || "all",
            pageViews,
            clicks,
            ctr: parseFloat(ctr),
            period: startDate && endDate ? {startDate, endDate} : "all_time",
        });
    } catch (error) {
        console.error("Error calculating CTR:", error.message);
        res.status(500).json({error: "Server error"});
    }
});

/**
 * GET /clicktracking/recent
 * 
 * Get user's most recent click events.
 * Useful for debugging or showing recent activity
 * 
 * Query Parameters:
 * - username: User's username
 * - limit: Number of events to return (default: 20)
 * 
 * @access JWT authentication required
 */
router.get("/recent", passport.authenticate("jwt"), async(req, res) => {
    try {
        const {username, limit = 20} = req.query;

        if(!username){
            return res.status(400).json({error: "User name is required"});
        }

        const recentClicks = await clickTracking
        .find({username})
        .sort({timestamp: -1})
        .limit(Number(limit))
        .select("page element action timestamp elementId -_id");

        return res.status(200).json(recentClicks);
    } catch (error) {
        console.error("Error fetching recent clicks:", error.message);
        res.status(500).json({error: "Server error"});
    }
});
module.exports = router;

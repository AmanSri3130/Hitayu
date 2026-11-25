const express = require('express');
const Chat = require('../models/Chat');
const User = require('../models/User');
const aiService = require('../services/aiService');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/chat/message
// @desc    Send a message to Ayu AI and get educational guidance
// @access  Private
router.post('/message', protect, async (req, res, next) => {
  try {
    const { message, chatId } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message text is required.'
      });
    }

    const user = await User.findById(req.user._id);

    // Find or create user chat session
    let chat;
    if (chatId) {
      chat = await Chat.findOne({ _id: chatId, user: user._id });
    }

    if (!chat) {
      chat = await Chat.findOne({ user: user._id }).sort({ updatedAt: -1 });
    }

    if (!chat) {
      chat = new Chat({
        user: user._id,
        title: message.slice(0, 35) + (message.length > 35 ? '...' : ''),
        messages: [],
        prakritiContext: {
          dominantDosha: user.prakritiSummary?.dominantDosha,
          vataPercent: user.prakritiSummary?.vataPercent,
          pittaPercent: user.prakritiSummary?.pittaPercent,
          kaphaPercent: user.prakritiSummary?.kaphaPercent
        }
      });
    }

    // Add user message
    chat.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Prepare context
    const userContext = {
      dominantDosha: user.prakritiSummary?.dominantDosha,
      vataPercent: user.prakritiSummary?.vataPercent,
      pittaPercent: user.prakritiSummary?.pittaPercent,
      kaphaPercent: user.prakritiSummary?.kaphaPercent,
      dietaryPreference: user.preferences?.dietaryPreference,
      allergies: user.preferences?.allergies
    };

    // Generate AI response
    const aiResult = await aiService.generateResponse({
      userMessage: message,
      userContext,
      conversationHistory: chat.messages.slice(-8)
    });

    // Add assistant response
    const assistantMsg = {
      role: 'assistant',
      content: aiResult.content,
      isFallback: aiResult.isFallback || false,
      references: aiResult.references || [],
      timestamp: new Date()
    };

    chat.messages.push(assistantMsg);
    await chat.save();

    res.json({
      success: true,
      chatId: chat._id,
      message: assistantMsg,
      history: chat.messages
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/chat/history
// @desc    Get user's chat history
// @access  Private
router.get('/history', protect, async (req, res, next) => {
  try {
    const chat = await Chat.findOne({ user: req.user._id }).sort({ updatedAt: -1 });

    res.json({
      success: true,
      chatId: chat ? chat._id : null,
      messages: chat ? chat.messages : []
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/chat/clear
// @desc    Clear chat history
// @access  Private
router.delete('/clear', protect, async (req, res, next) => {
  try {
    await Chat.deleteMany({ user: req.user._id });

    res.json({
      success: true,
      message: 'Chat conversation cleared successfully.'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

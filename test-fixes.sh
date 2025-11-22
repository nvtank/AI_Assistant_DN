#!/bin/bash

# 🧪 Quick Test Script for Bug Fixes
# Run this after refreshing your browser

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           🧪 QUICK TEST - BUG FIXES VERIFICATION               ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "📝 TEST CHECKLIST:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🤖 TEST #1: Puter AI Chatbot (CRITICAL)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Open: http://localhost:3000"
echo "2. Open DevTools Console (F12)"
echo "3. Type in chatbot: 'Gợi ý quán cafe gần đây'"
echo "4. Press Send"
echo ""
echo "✅ PASS if you see:"
echo "   - Proper Vietnamese text response"
echo "   - NOT [object Object]"
echo "   - Console shows: '✅ Extracted text from Claude format'"
echo ""
echo "❌ FAIL if you see:"
echo "   - [object Object]"
echo "   - Empty response"
echo ""
read -p "Did AI chatbot work correctly? (y/n): " ai_test

if [ "$ai_test" = "y" ]; then
    echo -e "${GREEN}✅ Puter AI Test PASSED${NC}"
else
    echo -e "${RED}❌ Puter AI Test FAILED - Check lib/puterAI.ts${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔔 TEST #2: Notification Permission"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Refresh page: http://localhost:3000"
echo "2. Check Console (F12)"
echo ""
echo "✅ PASS if:"
echo "   - NO warning about notification permission on page load"
echo "   - Page loads cleanly"
echo ""
echo "❌ FAIL if:"
echo "   - Warning: 'Notification permission may only be requested...'"
echo ""
read -p "Was page load clean (no notification warning)? (y/n): " notif_test

if [ "$notif_test" = "y" ]; then
    echo -e "${GREEN}✅ Notification Test PASSED${NC}"
else
    echo -e "${RED}❌ Notification Test FAILED - Check app/page.tsx${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔔 TEST #2b: Notification Request on User Action"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Click 'Report Incident' button"
echo "2. Fill in the form"
echo "3. Click 'Submit'"
echo ""
echo "✅ PASS if:"
echo "   - Browser asks for notification permission (first time only)"
echo "   - OR reports successfully if permission already granted"
echo ""
read -p "Did notification work on submit? (y/n): " notif_submit

if [ "$notif_submit" = "y" ]; then
    echo -e "${GREEN}✅ Notification Submit Test PASSED${NC}"
else
    echo -e "${YELLOW}⚠️  Check components/ReportIncidentForm.tsx${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 TEST #3: Geolocation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Check Console (F12)"
echo "2. Look for geolocation logs"
echo ""
echo "✅ PASS if:"
echo "   - Console shows: '🔍 Requesting geolocation...'"
echo "   - Map loads and shows Da Nang (or your location)"
echo "   - App works even if geolocation fails"
echo ""
echo "ℹ️  Note: Desktop computers usually fail geolocation (no GPS)"
echo "   This is EXPECTED and app handles it correctly!"
echo ""
read -p "Did map load successfully? (y/n): " geo_test

if [ "$geo_test" = "y" ]; then
    echo -e "${GREEN}✅ Geolocation Test PASSED${NC}"
else
    echo -e "${YELLOW}⚠️  Map should load with Da Nang center at minimum${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 TEST SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Count passes
passes=0
if [ "$ai_test" = "y" ]; then passes=$((passes+1)); fi
if [ "$notif_test" = "y" ]; then passes=$((passes+1)); fi
if [ "$notif_submit" = "y" ]; then passes=$((passes+1)); fi
if [ "$geo_test" = "y" ]; then passes=$((passes+1)); fi

echo "Tests Passed: $passes/4"
echo ""

if [ $passes -eq 4 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! Bug fixes are working!${NC}"
elif [ $passes -ge 2 ]; then
    echo -e "${YELLOW}⚠️  Some tests failed. Review FIXES_APPLIED.md${NC}"
else
    echo -e "${RED}❌ Multiple failures. Check console errors.${NC}"
fi

echo ""
echo "📖 For detailed info, read: FIXES_APPLIED.md"
echo "🔧 If issues persist, check browser console for errors"
echo ""

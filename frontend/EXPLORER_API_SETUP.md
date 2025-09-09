# Explorer API Setup Guide

## Overview
The Explorer page now uses block explorer APIs (Arbiscan and Bitlazer Explorer) instead of direct RPC calls for better performance and reliability.

## Environment Variables

### Local Development
1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Add your API keys to `.env`:
```env
# Required for Arbitrum transactions
VITE_ARBISCAN_API_KEY=your_arbiscan_api_key_here

# Optional - API endpoints (defaults are provided)
# VITE_ARBISCAN_API_URL=https://api.arbiscan.io/api
# VITE_BITLAZER_EXPLORER_API_URL=https://bitlazer.calderaexplorer.xyz/api
```

3. Get your Arbiscan API key:
   - Go to https://arbiscan.io/apis
   - Create a free account
   - Generate an API key
   - Add it to your `.env` file

### Production Deployment (GitHub Actions)

Add the following secrets to your GitHub repository:

1. Go to Settings → Secrets and variables → Actions
2. Add this repository secret:
   - `VITE_ARBISCAN_API_KEY`: Your Arbiscan API key

The GitHub Actions workflow (`web.yml`) will automatically use these secrets during the build process.

## API Rate Limits

### Arbiscan
- Free tier: 5 requests per second
- The implementation includes automatic rate limiting and retry logic

### Bitlazer Explorer
- Default: 10 requests per second
- No API key required for basic usage

## Features

### New Capabilities
- ✅ Faster transaction loading (uses indexed API data)
- ✅ Better pagination support
- ✅ Automatic caching (1 minute TTL)
- ✅ Rate limiting to prevent API throttling
- ✅ Automatic retry on failure
- ✅ Support for all transaction types (wrap, unwrap, bridge, stake, unstake, transfer)
- ✅ Internal transactions support
- ✅ Token transfer tracking

### API Endpoints Used

#### Arbiscan API
- `txlist` - Normal transactions
- `txlistinternal` - Internal transactions
- `tokentx` - ERC-20 token transfers
- `getLogs` - Event logs

#### Bitlazer Explorer API
- Same endpoints as Arbiscan (Etherscan-compatible API)

## Troubleshooting

### No transactions showing
1. Check console for API errors
2. Verify API keys are set correctly
3. Check network connectivity

### Rate limit errors
- The system automatically handles rate limiting
- If persistent, check your API key quotas

### Cache issues
- Transactions are cached for 1 minute
- Use the refresh button to force reload
- Clear browser cache if needed

## Development Tips

1. **Testing without API keys**: 
   - Bitlazer Explorer works without an API key
   - For Arbitrum, you'll need at least a free Arbiscan API key

2. **Monitoring API usage**:
   - Check browser console for API calls
   - Monitor rate limit headers in network tab

3. **Debugging**:
   - Enable verbose logging: `localStorage.setItem('debug', 'explorer:*')`
   - Check network tab for API responses

## Architecture

```
Explorer Component
    ↓
transactionServiceV2.ts
    ↓
┌─────────────┬─────────────┐
│ ArbiscanAPI │ BitlazerAPI │
└─────────────┴─────────────┘
    ↓
BaseExplorerAPI (rate limiting, retry logic)
    ↓
Block Explorer APIs
```

## Migration from RPC

The new implementation replaces direct RPC calls with explorer APIs:

- **Old**: `viem` clients fetching logs directly from nodes
- **New**: REST API calls to block explorers with caching

Benefits:
- 10x faster for large queries
- No need to manage block ranges
- Built-in pagination
- Better error handling
- Reduced RPC node load
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testExchangeRates() {
  console.log('=== TESTING EXCHANGE RATE FUNCTIONALITY ===\n');
  
  const prisma = new PrismaClient();
  
  try {
    // 1. Test fetching from Open Exchange Rates API
    console.log('1. Testing Open Exchange Rates API fetch...');
    
    const EXCHANGE_RATE_APP_ID = process.env.EXCHANGE_RATE_APP_ID;
    if (!EXCHANGE_RATE_APP_ID) {
      console.log('❌ EXCHANGE_RATE_APP_ID not found in environment');
      return;
    }
    
    console.log(`   Using API ID: ${EXCHANGE_RATE_APP_ID.substring(0, 8)}...`);
    
    try {
      const response = await fetch(`https://openexchangerates.org/api/latest.json?app_id=${EXCHANGE_RATE_APP_ID}&symbols=SEK`);
      
      if (!response.ok) {
        console.log(`❌ API request failed: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log(`   Response: ${text}`);
      } else {
        const data = await response.json();
        console.log('✅ API fetch successful');
        console.log(`   Base currency: ${data.base}`);
        console.log(`   USD → SEK rate: ${data.rates?.SEK || 'not found'}`);
        console.log(`   Timestamp: ${new Date(data.timestamp * 1000).toISOString()}`);
      }
    } catch (error) {
      console.log(`❌ API fetch error: ${error.message}`);
    }
    
    // 2. Test database exchange rate retrieval
    console.log('\n2. Testing database exchange rate retrieval...');
    
    const rates = await prisma.exchangeRate.findMany({
      where: {
        fromCurrency: 'USD',
        toCurrency: 'SEK',
        validUntil: null // Current rates
      },
      orderBy: { validFrom: 'desc' },
      take: 3
    });
    
    if (rates.length === 0) {
      console.log('❌ No current USD→SEK exchange rates in database');
    } else {
      console.log(`✅ Found ${rates.length} current exchange rates:`);
      rates.forEach((rate, i) => {
        console.log(`   ${i + 1}. Rate: ${rate.rate} (valid from: ${rate.validFrom})`);
      });
    }
    
    // 3. Test rate selection logic (simulate what import would use)
    console.log('\n3. Testing rate selection logic...');
    
    const currentRate = rates[0];
    if (currentRate) {
      console.log(`✅ Would use rate: ${currentRate.rate}`);
      
      // Test conversion
      const testUSDPrices = [100, 500, 1000, 5000];
      console.log('\n   Test conversions:');
      testUSDPrices.forEach(usd => {
        const sek = usd * currentRate.rate;
        console.log(`     $${usd} USD → ${sek.toFixed(2)} SEK`);
      });
    } else {
      console.log('❌ No rate available for conversion test');
    }
    
  } catch (error) {
    console.error('Error testing exchange rates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testExchangeRates();
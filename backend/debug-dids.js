
import getVeramoAgent from './veramo-setup.js';

async function listDIDs() {
    try {
        console.log('🔌 Connecting to Veramo agent...');
        const agent = await getVeramoAgent();

        console.log('🔍 Listing managed DIDs...');
        const dids = await agent.didManagerFind();

        console.log(`✅ Found ${dids.length} DIDs:`);
        dids.forEach((did, index) => {
            console.log(`${index + 1}. ${did.did} (Provider: ${did.provider})`);
            // console.log('   Alias:', did.alias);
        });

        if (dids.length === 0) {
            console.warn('⚠️ No DIDs found! Persistence might be broken.');
        }

    } catch (error) {
        console.error('❌ Error listing DIDs:', error);
    }
}

listDIDs();

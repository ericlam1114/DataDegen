//Calculate Whale Stats Here
//imports



// Dependencies 

const Moralis = require("moralis-v1/node");
const fs = require("fs");



// Moralis API info
const serverUrl = "https://qjjbhvlq5wbp.usemoralis.com:2053/server";
const appId = "kDu0eZZzRXjqbpzG7rqjEuj7D0jsO5JZDgd8QAvv";


//Contract address for the program to look at
//Moonbirds
const contractAddress = "0x23581767a106ae21c074b2276d25e5c3e136a68b";

//Filter out duplicate prices (usually these are bulk orders)
Array.prototype.getUnique = function(){
    var uniques = [];
    for(var i = 0, l = this.length; i < l; ++i){
        if(this.lastIndexOf(this[i]) == this.indexOf(this[i])) {
            uniques.push(this[i]);
        }
    }
    return uniques;
  }

//Calculate average price of NFT transfers. Applies filters; removing 0 value transfers and duplicates. Returns average ETH price
const averagePrice = (array) => {
    const filteredZero = array.filter(item => item !== 0);
    const filtered = filteredZero.getUnique();

    if(filtered.length > 1){
        return (filtered.reduce((a, b) => Number(a) + Number(b)) / filtered.length) / 1e18;
        
    }else if(filtered.length === 1){
        return filtered[0] / 1e18;
    }else{
        return 0;
    }
}


//calculate average days NFT has been held by a specific user
const averageDaySinceBuy = (array) => {
    let ms; 

    if (array.length > 1){
        ms = array.reduce((a,b) => new Date(a).getTime() + new Date(b).getTime()) / array.length;
    }else {
        ms = new Date(array[0]).getTime()
    }

    const diff = Math.floor((new Date().getTime() - ms) / 86400000)

    return diff;
}


//Get all owners of the NFT collection and the NFTs in their collection 
async function getAllOwners(){

    await Moralis.start({ serverUrl: serverUrl, appId: appId });
    //Moralis has a 100 transfer limit, the cursor is essentially a multiplier to tell Moralis how many times to loop through the limit
    let cursor = null;
    let owners = {};
    let history = {};
    let res;
    let accountedTokens = [];

    //// Blocktime from today to the past
    
    //Last 1 day; 24 hours
    let dateOne = new Date();
    
    dateOne.setDate(dateOne.getDate()-1);
    console.log("One day ago:", dateOne);
    
    //Last 7 days
    let dateSeven = new Date();
    
    dateSeven.setDate(dateSeven.getDate()-7);
    console.log("Seven days ago:", dateSeven);
    
    //Last 30 days
    let dateThirty = new Date();

    dateThirty.setDate(dateThirty.getDate()-30);
    console.log("30 days ago", dateThirty);

    //Last 365 days; 1 year
    let dateYear = new Date();

    dateYear.setDate(dateYear.getDate()-365);
    console.log("One year ago:", dateYear);

    // Call the API to check the transaction date
    
    
    // Call the API to check the transaction date
    // Call API for last 1 days
    const blockoptionsOne = {
        chain: "Eth",
        date: dateOne,
    };
    // Call the API for ^^^
    console.log("blockOneObject: ",blockoptionsOne)
    const blockOne = await Moralis.Web3API.native.getDateToBlock(blockoptionsOne);
    const dayBlock = Number(blockOne.block);
    console.log("one day ago (Block):", dayBlock);
    // Call the API to check the transaction date
    // Call API for last 7 days
    const blockoptionsSeven = {
        chain: "Eth",
        date: dateSeven,
    };
    // Call the API for ^^^
    console.log("blockSevenObject: ",blockoptionsSeven)
    const blockSeven = await Moralis.Web3API.native.getDateToBlock(blockoptionsSeven);
    const sevenBlock = Number(blockSeven.block);
    console.log("Seven Days ago (Block):", sevenBlock);
    
    // Call API for last 30 days
    const blockoptionsThirty = {
        chain: "Eth",
        date: dateThirty,
    };
    // Call the API for ^^^
    console.log("blockThirtyObject: ",blockoptionsThirty)
    const blockThirty = await Moralis.Web3API.native.getDateToBlock(blockoptionsThirty);
    const monthBlock = Number(blockThirty.block);
    console.log("Thirty Days ago (Block):", monthBlock);
    // console.log("monthBlock:",monthBlock);
    
    // Call the API to check the transaction date
    // Call API for last 365 days
    const blockoptionsYear = {
        chain: "Eth",
        date: dateYear,
    };
    // Call the API for ^^^
    console.log("blockYearObject:", blockoptionsYear)
    const blockYear = await Moralis.Web3API.native.getDateToBlock(blockoptionsYear);
    const yearBlock = Number(blockYear.block);
    console.log("Year ago (Block)", yearBlock)
    // console.log("yearBlock:", yearBlock);

    
  
    do{
        try{
        //loop through a specific contract address, specify address, chain, limit = 100 means maxed out, cursor: cursor makes it loop
        const response = await Moralis.Web3API.token.getContractNFTTransfers({
            address: contractAddress,
            chain: "eth",
            limit: 100,
            cursor: cursor,
        });
   
        //print on the console where the fetch cursor loop is in relation to total fetched
        res = response;
        console.log(
            // page_size is a response from the api call listed here; https://docs.moralis.io/reference/getnftcontracttransfers-1
            `Got page ${response.page} of ${Math.ceil(
                response.total / response.page_size
            )}, ${response.total} total responses`
        );

        //iterate through all results
        for (const transfer of res.result){

            let monthTx = 0;
            let weekTx = 0;
            let dayTx = 0;
            let yearTx = 0;
            let overYearTx = 0;

            //has the transfer happened within last 30 days?
            if(monthBlock < Number(transfer.block_number && sevenBlock > Number(transfer.block_number))){
                monthTx = 1;
                
            //has the transfer happened within last 7 days?
            }else if(sevenBlock < Number(transfer.block_number) && dayBlock > Number(transfer.block_number)){
                weekTx = 1;
                monthTx = 1;
                yearTx = 1;
            //has the transfer happened within last 1 days?
            }else if(dayBlock < Number(transfer.block_number)){
                dayTx = 1;
                weekTx = 1;
                monthTx = 1;
                yearTx = 1;
            //has the transfer happened within last 365 days?
            }else if(yearBlock < Number(transfer.block_number) && monthBlock > Number(transfer.block_number)){
                yearTx = 1;
                
            }else if(yearBlock > Number(transfer.block_number)){
            //if the loop reaches this stage, the transfer happened >1 year ago
                overYearTx = 1;
            }

            //check if owner has been added and if token id has been accounted for
            if(!owners[transfer.to_address] && !accountedTokens.includes(transfer.token_id)){
                // if owner not created, create owner
                owners[transfer.to_address] ={
                    //wrapping in Number() sets the value to a number (as opposed to assumed a string)
                    //address for wallet
                    address: transfer.to_address,
                    //how many owned
                    amount: Number(transfer.amount),
                    //array of token id
                    tokenId: [transfer.token_id],
                    // how much paid for each NFT/token
                    prices: [Number(transfer.value)],
                    //the block timestamp when NFT/token was acquired
                    dates: [transfer.block_timestamp],
                    monthTx: monthTx,
                    weekTx: weekTx,
                    dayTx: dayTx,
                    yearTx: yearTx,
                    overYearTx: overYearTx,
                    avgHold: averageDaySinceBuy([transfer.block_timestamp]),
                    averagePrice: Number(transfer.value) / 1e18,
                }
                accountedTokens.push(transfer.token_id);
            }else if(!accountedTokens.includes(transfer.token_id)){
                // if owner object is already created, push information to their object
                owners[transfer.to_address].amount++;
                owners[transfer.to_address].tokenId.push(transfer.token_id);
                owners[transfer.to_address].prices.push(Number(transfer.value));
                owners[transfer.to_address].dates.push(transfer.block_timestamp);
                owners[transfer.to_address].monthTx = owners[transfer.to_address].monthTx + monthTx;
                owners[transfer.to_address].weekTx = owners[transfer.to_address].weekTx + weekTx;
                owners[transfer.to_address].dayTx = owners[transfer.to_address].dayTx + dayTx;
                owners[transfer.to_address].yearTx = owners[transfer.to_address].yearTx + yearTx;
                owners[transfer.to_address].overYearTx = owners[transfer.to_address].overYearTx + overYearTx;
                owners[transfer.to_address].avgHold = averageDaySinceBuy(owners[transfer.to_address].dates);
                owners[transfer.to_address].averagePrice = averagePrice(owners[transfer.to_address].prices);

                accountedTokens.push(transfer.token_id);

            }
            // check if NFT holders are offloading their NFTs. If they are, how recently did it happen; day, week, month, year
            if(owners[transfer.from_address] && monthTx === 1){
                owners[transfer.from_address].monthTx = owners[transfer.from_address].monthTx - monthTx;
            }else if(owners[transfer.from_address] && weekTx === 1){
                owners[transfer.from_address].weekTx = owners[transfer.from_address].weekTx - weekTx;
            } else if (owners[transfer.from_address] && dayTx === 1){
                owners[transfer.from_address].dayTx = owners[transfer.from_address].dayTx - dayTx;
            }else if(owners[transfer.from_address] && yearTx === 1){
                owners[transfer.from_address].yearTx = owners[transfer.from_address].yearTx - yearTx;
            }else if(owners[transfer.from_address] && overYearTx === 1){
                owners[transfer.from_address].overYearTx = owners[transfer.from_address].overYearTx - overYearTx;
            }
            else if(!owners[transfer.from_address] && monthTx === 1){
                owners[transfer.from_address] = {
                    address: transfer.from_address,
                    amount: 0,
                    tokenId: [],
                    prices: [],
                    dates: [],
                    monthTx: -monthTx,
                    weekTx: weekTx,
                    dayTx: dayTx,
                    yearTx: yearTx,
                    overYearTx: overYearTx,

                }
            }else if(!owners[transfer.from_address] && weekTx === 1){
                owners[transfer.from_address] = {
                    address: transfer.from_address,
                    amount: 0,
                    tokenId: [],
                    prices: [],
                    dates: [],
                    monthTx: monthTx,
                    weekTx: -weekTx,
                    dayTx: dayTx,
                    yearTx: yearTx,
                    overYearTx: overYearTx,

                }
            }else if(!owners[transfer.from_address] && dayTx === 1){
                owners[transfer.from_address] = {
                    address: transfer.from_address,
                    amount: 0,
                    tokenId: [],
                    prices: [],
                    dates: [],
                    monthTx: monthTx,
                    weekTx: weekTx,
                    dayTx: -dayTx,
                    yearTx: yearTx,
                    overYearTx: overYearTx,
                }
            }else if(!owners[transfer.from_address] && yearTx === 1){
                owners[transfer.from_address] = {
                    address: transfer.from_address,
                    amount: 0,
                    tokenId: [],
                    prices: [],
                    dates: [],
                    monthTx: monthTx,
                    weekTx: weekTx,
                    dayTx: dayTx,
                    yearTx: -yearTx,
                    overYearTx: overYearTx,
                }
            }else if(!owners[transfer.from_address] && overYearTx === 1){
                    owners[transfer.from_address] = {
                        address: transfer.from_address,
                        amount: 0,
                        tokenId: [],
                        prices: [],
                        dates: [],
                        monthTx: monthTx,
                        weekTx: weekTx,
                        dayTx: dayTx,
                        yearTx: yearTx,
                        overYearTx: -overYearTx,
                    }
            }
            // all wallets that have made transfers within this collection... TO TRANSFERS
            //new wallets doing transfers
            if (!history[transfer.to_address]){
                history[transfer.to_address] = [
                    {
                        to: transfer.to_address,
                        from: transfer.from_address,
                        price: transfer.value,
                        date: transfer.block_timestamp,
                        tokenId: transfer.token_id,
                    },
                ]
                //push existing wallets doing transfers
            }else{
                history[transfer.to_address].push({
                    to: transfer.to_address,
                    from: transfer.from_address,
                    price: transfer.value,
                    date: transfer.block_timestamp,
                    tokenId: transfer.token_id,
                });
            }

            // all wallets that have made transfers within this collection... FROM TRANSFERS
            //new wallets doing transfers
            if (!history[transfer.from_address]){
                history[transfer.from_address] = [
                    {
                        to: transfer.to_address,
                        from: transfer.from_address,
                        price: transfer.value,
                        date: transfer.block_timestamp,
                        tokenId: transfer.token_id,
                    },
                ]
                //push existing wallets doing transfers
            }else{
                history[transfer.from_address].push({
                    to: transfer.from_address,
                    from: transfer.from_address,
                    price: transfer.value,
                    date: transfer.block_timestamp,
                    tokenId: transfer.token_id,
                });
            }


        }

        cursor = res.cursor; }catch(e){
            console.log(e)}

    }while (cursor != "" && cursor != null );

    //turn data into json data and write JSON object to file
    const jsonContentOwners = JSON.stringify(owners);
    const jsonContentHistory = JSON.stringify(history);
    fs.writeFile("moonbirdsOwners.json", jsonContentOwners, "utf8", function(err){
        if (err){
            console.log("An error occured while writing JSON Object to File.");
            return console.log(err);
        }
        console.log("JSON file has been saved.");
    });
    fs.writeFile("moonbirdsHistory.json", jsonContentHistory, "utf8", function(err){
        if (err){
            console.log("An error occured while writing JSON Object to File.");
            return console.log(err);
        }
        console.log("JSON file has been saved.");
    });

}



getAllOwners();

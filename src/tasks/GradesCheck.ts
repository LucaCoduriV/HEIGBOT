// This task will help remove un-used collectors to help keep our cache optimized.
import { botCache, cache, ChannelTypes } from "../../deps.ts";
import { Milliseconds } from "../utils/constants/time.ts";
import puppeteer, { ElementHandle } from "https://deno.land/x/puppeteer@5.5.1/mod.ts";
import {Store} from 'https://deno.land/x/storeosaurus@2.0.1/mod.ts';
import { configs } from "../../configs.ts";

botCache.tasks.set(`collectors`, {
  name: `collectors`,
  // Runs this function once a minute
  interval: Milliseconds.MINUTE * 20,
  execute: async function () {
    
    const browser = await puppeteer.launch({
        headless: true,
        
    });
    const page = await browser.newPage();
    await page.goto("https://gaps.heig-vd.ch/consultation/", { waitUntil: 'networkidle0' });
    
    await page.type('#ident', configs.gapsid);
    await page.type('#mdp', configs.gapspass);
    // click and wait for navigation
    await page.click('.bouton');
    await page.waitForTimeout(500);
    console.log("Connection ok");
    
    await page.goto("https://gaps.heig-vd.ch/consultation/controlescontinus/consultation.php?idst=16746", { waitUntil: 'networkidle0' });
    console.log("Page de note ok");
    
    const resultats = await page.$$eval('.displayArray tr', rows => {
        return Array.from(rows, row => {
            const columns = row.querySelectorAll('td');
            
    
            return columns[4] ? columns[4].innerText : null;
        });
    });
    
    const resultats2 = (resultats as unknown as Array<number>).filter((value)=>{
        return value && !isNaN(value);
    })
    console.table(resultats2);
    
    await browser.close();
    
    const counter = Store.open<number>({
        name: 'nombreNote',
        default: 0
    });
    
    if(counter.get() != resultats2.length){
        counter.set(resultats2.length);
        onNewGrade();
    }
    
    
    
    
    async function onNewGrade(){
        console.log("Nouvelles notes !")
        cache.channels.forEach((channel)=>{
            if(channel.type == ChannelTypes.GUILD_TEXT && channel.name == "général" || channel.name == "heig-vd"){
                channel.send("ON A UNE NOUVELLE NOTE !");
            }
            
        })
    }

  },
});

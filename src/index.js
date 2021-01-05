const fs = require('fs');
const Discord = require('discord.js');

const config = JSON.parse(fs.readFileSync(`${__dirname}/config.json`, "utf-8").toString());

let settings = JSON.parse(fs.readFileSync(`${__dirname}/settings.json`, "utf-8").toString());

const client = new Discord.Client();


client.on('ready', ()=> {
    console.log("Client startet Successfully as "+ client.user.tag);

    client.user.setActivity(`for Preifx: ${config.prefix}`, {type: "WATCHING"});
});


client.on('message', msg => {
    if(!msg.content.startsWith(config.prefix)) return;
    msg.content = msg.content.slice(config.prefix.length +1);

    if(msg.content == "ping") msg.channel.send("pong");

    if(msg.content == "setup channel"){
        
    }

})

client.login(config.token);
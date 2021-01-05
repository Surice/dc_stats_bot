const fs = require('fs');
const Discord = require('discord.js');
const cron = require('cron').CronJob;

const config = JSON.parse(fs.readFileSync(`${__dirname}/config.json`, "utf-8").toString());

let settings = JSON.parse(fs.readFileSync(`${__dirname}/settings.json`, "utf-8").toString());

const client = new Discord.Client({ partials: ['USER'] });

const channelNames = ['🟢 Online: ', "👪 total Member: ", "🕒 mm:hh 📆 01.01.00"];



var job = new cron('0 * * * * *', async function() {
    let d = new Date(),
        time = `${d.getHours()}:${d.getMinutes()}`,
        date = `${d.getDate()}/${d.getMonth() +1}/${d.getFullYear()}`;

    for (e in settings){
        let channel = await client.channels.fetch(settings[e][2]);

        channel.setName(`🕒 ${time} 📆 ${date}`);
    }
});
job.start();



client.on('ready', ()=> {
    console.log("Client startet Successfully as "+ client.user.tag);

    client.user.setActivity(`for Preifx: ${config.prefix}`, {type: "WATCHING"});
});


client.on('message', msg => {
    if(!msg.content.startsWith(config.prefix)) return;
    msg.content = msg.content.slice(config.prefix.length).split(' ');

    if(msg.content[0] == "ping") msg.channel.send("pong");

    if(msg.content[0] == "test"){
        msg.channel.send("no tests running!");
    }


    if(msg.content[0] == "setup" && msg.content[1] == "channel"){
        if(!msg.member.hasPermission('ADMINISTRATOR')){
            msg.channel.send("unauthorized!");
            return;
        }

        console.log("running setup");
        let guild = msg.guild,
            count = 3;

        settings[guild.id] = [];

        msg.guild.channels.create('stats', {type: "category"}).then(async category => {
            channelNames.forEach(item => {
                guild.channels.create(item, {
                    type: "voice",
                    position: 0,
                    parent: category.id,
                    permissionOverwrites: [{
                        id: guild.roles.everyone,
                        deny: ['CONNECT']
                        
                    }]
                }).then(async channel => {
                    count--
                    settings[guild.id].push(channel.id);

                    fs.writeFileSync(`${__dirname}/settings.json`, JSON.stringify(settings));
                    if(count <= 0){
                        checkOnlineCount(guild);
                        checkMemberCount(guild);
                    }
                });
            });
            
        });
    }
})

client.on('guildMemberAdd', member => {
    checkMemberCount(member.guild);
    checkOnlineCount(member.guild);
});
client.on('guildMemberRemove', member => {
    checkMemberCount(member.guild);
    checkOnlineCount(member.guild);
});

client.on('presenceUpdate', (oldUser, newUser) => {
    if(!oldUser){
        checkOnlineCount(newUser.guild);
    }else{
        if(oldUser.status != newUser.status){
            checkOnlineCount(newUser.guild);
        }
    }
});


async function checkMemberCount(guild){
    let channel = await client.channels.fetch(settings[guild.id][1]);
    channel.setName(`${channelNames[1]} ${guild.memberCount}`);
}
async function checkOnlineCount(guild){
    let channel = await client.channels.fetch(settings[guild.id][0]);
    channel.setName(`${channelNames[0]} ${guild.members.cache.filter(member => member.presence.status != "offline").size}`);
}


client.login(config.token);

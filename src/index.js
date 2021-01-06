const fs = require('fs');
const Discord = require('discord.js');
const Cron = require('cron').CronJob;

const config = JSON.parse(fs.readFileSync(`${__dirname}/config.json`, "utf-8").toString());

const client = new Discord.Client({ partials: ['USER'] });

const channelNames = ['🟢 Online: ', "👪 total Member: ", "🕒 mm:hh 📆 01.01.00"];

let settings = JSON.parse(fs.readFileSync(`${__dirname}/settings.json`, "utf-8"));


let job = new Cron('0 * * * * *', async () => {
    let d = new Date(),
        time = `${convertTime(d.getHours())}:${convertTime(d.getMinutes())}`,
        date = `${d.getDate()}/${d.getMonth() +1}/${d.getFullYear()}`;

    for (e in settings){
        let guild = await client.guilds.fetch(e),
            channel = guild.channels.cache.get(settings[e][2]);

        channel.delete();
        let newChannel = await guild.channels.create(`🕒 ${time} 📆 ${date}`, {
            type: "voice",
            parent: settings[e][3],
            permissionOverwrites: [{
                id: guild.roles.everyone,
                deny: ['CONNECT']
            }]
        });

        settings[e][2] = newChannel.id;

        fs.writeFileSync(`${__dirname}/settings.json`, JSON.stringify(settings));
    }
});
job.start();


function convertTime(item){
    if(item.toString().length == 1){
        return `0${item}`;
    }else{
        return item;
    }
}

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
            channelNames.forEach(async item => {
                let channel = await guild.channels.create(item, {
                    type: "voice",
                    parent: category.id,
                    permissionOverwrites: [{
                        id: guild.roles.everyone,
                        deny: ['CONNECT']
                        
                    }]
                });
                count--
                settings[guild.id].push(channel.id);

                if(count <= 0){
                    settings[guild.id].push(category.id);
                    fs.writeFileSync(`${__dirname}/settings.json`, JSON.stringify(settings));

                    checkOnlineCount(guild);
                    checkMemberCount(guild);
                }
            });
        });
    }
})

client.on('guildMemberAdd', member => {
    checkOnlineCount(member.guild);
    checkMemberCount(member.guild);
});
client.on('guildMemberRemove', member => {
    checkOnlineCount(member.guild);
    checkMemberCount(member.guild);
});

client.on('presenceUpdate', (oldUser, newUser) => {
    if(!oldUser){
        checkOnlineCount(newUser.guild);
        checkMemberCount(newUser.guild);
    }else{
        if(oldUser.status != newUser.status){
            checkOnlineCount(newUser.guild);
            checkMemberCount(newUser.guild);
        }
    }
});


async function checkMemberCount(guild){
    let oldChannel = await client.channels.fetch(settings[guild.id][1]);
    oldChannel.delete();

    let channel = await guild.channels.create(`${channelNames[1]} ${guild.memberCount}`, {
        type: "voice",
        parent: settings[guild.id][3],
        position: 1,
        permissionOverwrites: [{
            id: guild.roles.everyone,
            deny: ['CONNECT']
            
        }]
    });

    settings[guild.id][1] = channel.id;

    fs.writeFileSync(`${__dirname}/settings.json`, JSON.stringify(settings));
}
async function checkOnlineCount(guild){
    let oldChannel = await client.channels.fetch(settings[guild.id][0]);
    oldChannel.delete();

    let channel = await guild.channels.create(`${channelNames[0]} ${guild.members.cache.filter(member => member.presence.status != "offline").size}`, {
        type: "voice",
        parent: settings[guild.id][3],
        position: 1,
        permissionOverwrites: [{
            id: guild.roles.everyone,
            deny: ['CONNECT']
            
        }]
    });
    settings[guild.id][0] = channel.id;

    fs.writeFileSync(`${__dirname}/settings.json`, JSON.stringify(settings));
}



client.login(config.token);

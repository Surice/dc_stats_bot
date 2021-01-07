const fs = require('fs');
const Discord = require('discord.js');
const Cron = require('cron').CronJob;

const config = JSON.parse(fs.readFileSync(`${__dirname}/config.json`, "utf-8").toString());

const client = new Discord.Client({ partials: ['USER', 'CHANNEL'] });

const channelNames = ['🟢 Online: ', "👪 total Member: ", "🕒 mm:hh 📆 01.01.00"];

let managedGuilds = JSON.parse(fs.readFileSync(`${__dirname}/settings.json`, "utf-8"));


let job = new Cron('0 * * * * *', async () => {
    let d = new Date(),
        time = `${convertTime(d.getHours())}:${convertTime(d.getMinutes())}`,
        date = `${d.getDate()}/${d.getMonth() +1}/${d.getFullYear()}`;

    managedGuilds.forEach(async e => {
        let guild = await client.guilds.fetch(e),
            channels = guild.channels.cache.filter(channel => channel.type == "voice"),
            settings = {
                type: "voice",
                permissionOverwrites: [{
                    id: guild.roles.everyone,
                    deny: ['CONNECT']
                }]
            };

        channels.forEach(channel => {
            let channelName = channel.name.split(' ');
            try{
                let time = channelName[1].split(':'),
                    date = channelName[3].split('/');

                let result = parseFloat(time[0] + time[1] + date[0] + date [1] + date[2]);

                if(result){
                    if(channel.parentID) settings.parent = channel.parentID;

                    settings.position = channel.position;

                    channel.delete();
                }
            }catch(err){}
        });

        guild.channels.create(`🕒 ${time} 📆 ${date}`, settings);
    });
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


client.on('message', async msg => {
    if(!msg.content.startsWith(config.prefix)) return;
    msg.content = msg.content.slice(config.prefix.length).split(' ');

    if(msg.content[0] == "ping") msg.channel.send("pong");

    if(msg.content[0] == "test"){
    }

    if(msg.content[0] == "cleanup"){
        if(!msg.member.hasPermission('ADMINISTRATOR')){
            msg.channel.send("unauthorized!");
            return;
        }

        managedGuilds.forEach(async guildID => {
            if(guildID != '293403456646021120') return;
            let guild = await client.guilds.fetch(guildID),
                channels;

            await channelNames.forEach(name => {
                channels = guild.channels.cache.filter(channel => channel.name.startsWith(name));

                channels.each(channel => {
                    channel.delete();
                });
            });
        });
    }

    
    if(msg.content[0] == "setup" && msg.content[1] == "channel"){
        if(!msg.member.hasPermission('ADMINISTRATOR')){
            msg.channel.send("unauthorized!");
            return;
        }
        console.log("running setup");

        let guild = msg.guild,
            count = 3;

        managedGuilds.push(guild.id);
        fs.writeFileSync(`${__dirname}/settings.json`, managedGuilds);

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

                if(count <= 0){
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
    }else{
        if(oldUser.status != newUser.status){
            checkOnlineCount(newUser.guild);
        }
    }
});

async function checkMemberCount(guild){
    let oldChannel = await guild.channels.cache.filter(channel => channel.name.startsWith(channelNames[1]));
        settings = {
            type: "voice",
            permissionOverwrites: [{
                id: guild.roles.everyone,
                deny: ['CONNECT']
            }]
        };

    oldChannel.each(async channel => {
        if(channel.parentID) settings.parent = channel.parentID;

        settings.position = channel.position;
        let newChannel = await guild.channels.create(`${channelNames[1]} ${guild.memberCount}`, settings);
        console.log(`${settings.position} / ${newChannel.position}`);

        channel.delete();
    });
}
async function checkOnlineCount(guild){
    let oldChannel = await guild.channels.cache.filter(channel => channel.name.includes('Online: ')),
        settings = {
            type: "voice",
            permissionOverwrites: [{
                id: guild.roles.everyone,
                deny: ['CONNECT']
            }]
        };

    oldChannel.each(async channel => {
        let onlineMembersCount = guild.members.cache.filter(member => member.presence.status != "offline").size;
        
        if(channel.parentID) settings.parent = channel.parentID;

        settings.position = channel.position;
        let newChannel = await guild.channels.create(`${channelNames[0]} ${onlineMembersCount}`, settings);
        console.log(`${settings.position} / ${newChannel.position}`);
        channel.delete();
    });
}



client.login(config.token);

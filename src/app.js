/**
 * LoL Stats
 * By Ricardo Canales!
 */

// ================================= Libraries =================================

var ajax = require('ajax');
var UI = require('ui');
var Settings = require('settings');
// ================================ Constants ==================================


var gametype = {}; // or just {}

gametype['NONE'] = "Custom";
gametype['NORMAL'] = "Unranked - Summoner's Rift";
gametype['NORMAL_3x3'] = "Unranked - Twisted Treeline";
gametype['ODIN_UNRANKED'] = "Dominion/Crystal Scar";
gametype['ARAM_UNRANKED_5x5'] = "ARAM / Howling Abyss";
gametype['BOT'] = "AI - Summoner's Rift";
gametype['BOT_3x3'] = "AI - Twisted Treeline";
gametype['RANKED_SOLO_5x5'] = "Ranked Solo- Summoner's Rift";
gametype['RANKED_TEAM_3x3'] = "Ranked Team - Twisted Treeline";
gametype['RANKED_TEAM_5x5'] = "Ranked Team - Summoner's Rift";
gametype['ONEFORALL_5x5'] = "One for All";
gametype['FIRSTBLOOD_1x1'] = "Snowdown Showdown 1x1";
gametype['FIRSTBLOOD_2x2'] = "Snowdown Showdown 2x2";
gametype['SR_6x6'] = "Hexakill - Summoner's Rift";
gametype['CAP_5x5'] = "Team Builder";
gametype['URF'] = "Ultra Rapid Fire";
gametype['URF_BOT'] = "AI - Ultra Rapid Fire";
gametype['NIGHTMARE_BOT'] = "Nightmare AI - Summoner's Rift";
gametype['ASCENSION'] = "Ascension";
gametype['HEXAKILL'] = "Hexakill - Twisted Treeline";
gametype['KING_PORO'] = "King Poro";

// ================================= Front-End =================================

//Preloading Main Menu
var menu = new UI.Menu({
  sections: [{
    items: [{
      title: 'Loading...',
      icon: 'images/lolstats.png'
    }]
  },{
    title: 'Statistics',
    items: [{
      title: 'Ranked 5v5',
      subtitle: 'Wins, Losses, Kills, Assits, Minion Kills'
    },{
      title: 'Unranked 5v5',
      subtitle: 'Wins, Kills, Assits, Minions Killed, Turrets Killed'
    },{
      title: 'Recent Matches',
      subtitle: 'View recent matches stats'
    }]
  }]
});

//Preloading Ranked Menu
var rankedSummary = new UI.Menu({
  sections: [{
    title: 'Ranked 5v5',
    items: [{
      title: 'Loading...' 
    }]
  }]
});


//Preloading UnRanked Menu
var unrankedSummary = new UI.Menu({
  sections: [{
    title: 'Unranked 5v5',
    items: [{
      title: 'Loading...' 
    }]
  }]
});

//Preloading Recent Matches
var matchHistory = new UI.Menu({
  sections: [{
    title: 'Loading...',
    items: [{
      title: 'Loading...' 
    }]
  }]
});

// ================================ Alert Cards ================================
// Settings card
var settings = new UI.Card({
  title: 'Set Settings',
  body: 'Save settings to use the application.'
});

// Error card
var warning = new UI.Card({
  title: 'Error',
  icon: 'images/lolstats.png'
});

// ================================= Settings ==================================
var api_key = 'f07420f5-3ae0-4c25-b5cd-dcbdf7c71605';
var options = Settings.option();
var summoner, stats;
var rankedPresent = false;

// Configurable with just the close callback
function setSettings(){
  Settings.config(
    { url: 'http://www.canalesb.com/config/lolstats?'+encodeURIComponent(JSON.stringify(options)) },
    function(e) {
  
      console.log('opening configurable');
      console.log('Path: http://www.canalesb.com/config/lolstats?'+encodeURIComponent(JSON.stringify(options)));
      // Reset color to red before opening the webview
      console.log(JSON.stringify(options));
  
      settings.show();
    },
    function(e) {
      console.log('closed configurable');
      // Show the parsed response
      settings.hide();
  
      if (e.response.charAt(0) == "{" && e.response.slice(-1) == "}" && e.response.length > 5) {
        options = JSON.parse(decodeURIComponent(e.response));
        //Turn Summoner Name into queryable and set in Settings
        options.username = superTrim(options.username);
        console.log('Summoner end name: '+options.username);
        Settings.option('username', options.username);

        console.log("Options = " + JSON.stringify(options));
        summonerRequest();
        setSettings();
      } else {
        console.log("Cancelled");
      }
    }
  );
}


// =================================== Main ====================================

setSettings();

menu.show();
if(!options.username){
  settings.show();
} else {
  summonerRequest();
}

menu.on('select', function(e) {
  console.log('Selected item #' + e.itemIndex + ' of section #' + e.sectionIndex);
  console.log('The item is titled "' + e.item.title + '"');

  if(e.itemIndex === 0 && e.sectionIndex === 1){
    rankedOpen();
  } else if(e.itemIndex === 1 && e.sectionIndex === 1){
    unrankedOpen();
  } else if(e.itemIndex === 2 && e.sectionIndex === 1){
    recentOpen();
  }
});

// =============================== Ajax Requests ===============================

function summonerRequest(){
  //MainMenu AJAX Call
  ajax({ url: 'https://'+options.region+'.api.pvp.net/api/lol/'+options.region+'/v1.4/summoner/by-name/'+options.username+'?api_key='+api_key, type: 'json' },
    function(data) {
      console.log('Ajax succesful');
      console.log('SummonerID: ' + data[options.username].id);
      summoner = data[options.username];
      menu.item(0,0,{ title: summoner.name, subtitle: 'Level: ' + summoner.summonerLevel});
      statsRequest();
    },
    function(error){
      console.log('The ajax request failed: ' + error);
      if(error){
        warning.subtitle('Summoner not found');
        warning.scrollable(true);
        warning.body('Riot returned 404 Error to summoner "'+options.username+'" on region "'+options.region+'".');
      } else {
        warning.subtitle('No response from Riot servers');
        warning.scrollable(true);
        warning.body('A connection could not be established.');
      }
      warning.show();
    }
  );
}

function statsRequest(){
  ajax({ url: 'https://'+options.region+'.api.pvp.net/api/lol/'+options.region+'/v1.3/stats/by-summoner/'+summoner.id+'/summary?season=SEASON4&api_key='+api_key, type: 'json', async: false },
    function(data) {
      stats = data;
      console.log('Ajax Stats request succesful!');
      for (var i = 0; data.playerStatSummaries[i]; i++) {
        console.log('type: ' + data.playerStatSummaries[i].playerStatSummaryType);
        if(data.playerStatSummaries[i].playerStatSummaryType == 'Unranked'){
          var sectionUnranked = {
            title: 'Unranked 5v5',
            items: [{
              title: 'Wins: ' + data.playerStatSummaries[i].wins
            },{
              title: 'Kills: ' + data.playerStatSummaries[i].aggregatedStats.totalChampionKills,
              subtitle: 'Assists: ' + data.playerStatSummaries[i].aggregatedStats.totalAssists
            },{
              title: 'Minion Kills: ' + data.playerStatSummaries[i].aggregatedStats.totalMinionKills,
              subtitle: 'Neutral Kills: ' + data.playerStatSummaries[i].aggregatedStats.totalNeutralMinionsKilled
            },{
              title: 'Turret Kills: ' + data.playerStatSummaries[i].aggregatedStats.totalTurretsKilled
            }]
          };
          unrankedSummary.section(0, sectionUnranked);
        } else if(data.playerStatSummaries[i].playerStatSummaryType == 'RankedSolo5x5'){
          if(data.playerStatSummaries[i].wins === 0 && data.playerStatSummaries[i].losses === 0){
            console.log('No ranked games found');
          } else {
            rankedPresent = true;
            var sectionRanked = {
              title: 'Ranked Solo 5v5',
              items: [{
                title: 'Wins: ' + data.playerStatSummaries[i].wins
              },{
                title: 'Losses: ' + data.playerStatSummaries[i].losses
              },{
                title: 'Kills: ' + data.playerStatSummaries[i].aggregatedStats.totalChampionKills,
                subtitle: 'Assists: ' + data.playerStatSummaries[i].aggregatedStats.totalAssists
              },{
                title: 'Minion Kills: ' + data.playerStatSummaries[i].aggregatedStats.totalMinionKills,
                subtitle: 'Neutral Kills: ' + data.playerStatSummaries[i].aggregatedStats.totalNeutralMinionsKilled
              },{
                title: 'Turret Kills: ' + data.playerStatSummaries[i].aggregatedStats.totalTurretsKilled
              }]
            };
            rankedSummary.section(0, sectionRanked);
          }
        }
      }
    }, 
    function(error){
      console.log('The ajax request failed: ' + error);
      unrankedSummary.item(0,0,{ title: 'Loading Failed'});
      rankedSummary.item(0,0,{ title: 'Loading Failed'});
    }
  );
}


function matchRequest(){
  ajax({ url: 'https://'+options.region+'.api.pvp.net/api/lol/'+options.region+'/v1.3/game/by-summoner/'+summoner.id+'/recent?api_key='+api_key, type: 'json' },
    function(data) {
      console.log('Ajax Matches request succesful!');
      
      // Set date
      var date = new Date(data.games[0].createDate).toDateString();
      var sectionIndex = 0, itemIndex = 0;
      var sectionDate = {
        title: date
      };
      matchHistory.section(sectionIndex, sectionDate);
      
      for (var i = 0; data.games[i] || i < 3; i++) {
        var game = data.games[i];
        var matchdate = new Date(game.createDate).toDateString();
        var result = 'Defeat:';
        var kda = game.stats.championsKilled + '/' + game.stats.numDeaths + '/' + game.stats.assists;
        if(game.stats.win)
          result = 'Victory:';

        if(matchdate != date){
          date = matchdate;
          sectionDate = {
            title: date
          };
          sectionIndex++;
          matchHistory.section(sectionIndex, sectionDate);
          itemIndex = 0;
        }
        matchHistory.item(sectionIndex, itemIndex, { title: result + kda , subtitle: gametype[game.subType] });
        itemIndex++;
      }
    }, 
    function(error){
      console.log('The ajax request failed: ' + error);
      matchHistory.item(0,0,{ title: 'Loading Failed'});
    }
  );
}

// ============================== Usage Functions===============================

function rankedOpen(){
  if(!stats){
    statsRequest();
  }
  if(rankedPresent){
    rankedSummary.show();
  } else {
    displayNoRanked();
  }
}

function unrankedOpen(){
  if(!stats){
    statsRequest();
  }
  unrankedSummary.show();
}

function recentOpen(){
  matchRequest();
  matchHistory.show();
}


function superTrim(name){
  var newName = name.replace(/\s+/g, '');
  newName = newName.toLowerCase();
  return newName;
}

function displayNoRanked(){
  warning.scrollable(false);
  warning.subtitle('Ranked Data not found.');
  warning.body('Play some ranked games to get this information.');
  rankedSummary.hide();
  warning.show();
}

function displayNoUnranked(){
  warning.scrollable(false);
  warning.subtitle('Unranked Data not found.');
  warning.body('Play some unranked games to get this information.');
  unrankedSummary.hide();
  warning.show();
}

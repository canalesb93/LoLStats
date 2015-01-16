/**
 * LoL Stats
 * By Ricardo Canales!
 */

// ================================= Libraries =================================

var ajax = require('ajax');
var UI = require('ui');
var Settings = require('settings');

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
var summoner;

// Configurable with just the close callback
function setSettings(){
  Settings.config(
    { url: 'http://192.168.15.132:3000/config/lolstats?'+encodeURIComponent(JSON.stringify(options)) },
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

setSettings();


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
    }]
  }]
});

menu.show();
if(!options.username){
  settings.show();
} else {
  summonerRequest();
}

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

menu.on('select', function(e) {
  console.log('Selected item #' + e.itemIndex + ' of section #' + e.sectionIndex);
  console.log('The item is titled "' + e.item.title + '"');

  if(e.itemIndex === 0 && e.sectionIndex === 1){
    rankedSummary.show();    
    rankedRequest();
  } else if(e.itemIndex === 1 && e.sectionIndex === 1){
    unrankedSummary.show();    
    unrankedRequest();
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
    },
    function(error){
      console.log('The ajax request failed: ' + error);
      warning.subtitle('Summoner not found.');
      warning.scrollable(true);
      warning.body('The account with the username "'+options.username+'" was not found on region "'+options.region+'".');
      warning.show();
    }
  );
}

function rankedRequest(){
  ajax({ url: 'https://'+options.region+'.api.pvp.net/api/lol/'+options.region+'/v1.3/stats/by-summoner/'+summoner.id+'/summary?season=SEASON4&api_key='+api_key, type: 'json' },
    function(data) {
      console.log('Ajax succesful');
      for (var i = 0; data.playerStatSummaries[i]; i++) { 
        if(data.playerStatSummaries[i].playerStatSummaryType == 'RankedSolo5x5'){
          if(data.playerStatSummaries[i].wins === 0 && data.playerStatSummaries[i].losses === 0){
            displayNoRanked();
          } else {
            var sectionOne = {
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
            rankedSummary.section(0, sectionOne);
          }
        }
      }
    }, 
    function(error){
      console.log('The ajax request failed: ' + error);
      rankedSummary.item(0,0,{ title: 'Loading Failed'});
    }
  );
}

function unrankedRequest(){
  ajax({ url: 'https://'+options.region+'.api.pvp.net/api/lol/'+options.region+'/v1.3/stats/by-summoner/'+summoner.id+'/summary?season=SEASON4&api_key='+api_key, type: 'json' },
    function(data) {
      console.log('Ajax succesful');
      for (var i = 0; data.playerStatSummaries[i]; i++) {
        console.log('type: ' + data.playerStatSummaries[i].playerStatSummaryType);
        if(data.playerStatSummaries[i].playerStatSummaryType == 'Unranked'){
          var sectionOne = {
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
          unrankedSummary.section(0, sectionOne);
        }  
      }
    }, 
    function(error){
      console.log('The ajax request failed: ' + error);
      unrankedSummary.item(0,0,{ title: 'Loading Failed'});
    }
  );
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
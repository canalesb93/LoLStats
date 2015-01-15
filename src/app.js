/**
 * LoL Stats
 * By Ricardo Canales!
 */

// ================================= Libraries =================================

var ajax = require('ajax');
var UI = require('ui');
var Settings = require('settings');

// Settings card
var settings = new UI.Card({
  title: 'Set Settings',
  body: 'Save settings to use the application.'
});

// ================================= Settings ==================================
var api_key = 'f07420f5-3ae0-4c25-b5cd-dcbdf7c71605';
var options = Settings.option();
var summoner;

// Configurable with just the close callback
Settings.config(
  { url: 'http://localhost:3000/config/lolstats?'+encodeURIComponent(JSON.stringify(options))); },
  function(e) {

    console.log('opening configurable');
    console.log('Path: http://localhost:3000/config/lolstats?'+encodeURIComponent(JSON.stringify(options))));
    // Reset color to red before opening the webview
    var options = Settings.option();
    console.log(JSON.stringify(options));

    settings.show();
  },
  function(e) {
    console.log('closed configurable');
    // Show the parsed response


    if (e.response.charAt(0) == "{" && e.response.slice(-1) == "}" && e.response.length > 5) {
      options = JSON.parse(decodeURIComponent(e.response));
      console.log("Options = " + JSON.stringify(options));
      settings.hide();
      summonerRequest();
    } else {
      console.log("Cancelled");
    }
    

    // Show the raw response if parsing failed
    if (e.failed) {
      console.log("failed: " + e.response);
    }
  }
);


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
      console.log('SummonerID: ' + data[options.username].id);
      summoner = data[options.username];
      menu.item(0,0,{ title: summoner.name, subtitle: 'Level: ' + summoner.summonerLevel});
    },
    function(error){
      console.log('The ajax request failed: ' + error);
    }
  );
}

function rankedRequest(){
  ajax({ url: 'https://'+options.region+'.api.pvp.net/api/lol/'+options.region+'/v1.3/stats/by-summoner/'+summoner.id+'/summary?season=SEASON4&api_key='+api_key, type: 'json' },
    function(data) {
      var sectionOne = {
        title: 'Ranked Solo 5v5',
        items: [{
          title: 'Wins: ' + data.playerStatSummaries[9].wins
        },{
          title: 'Losses: ' + data.playerStatSummaries[9].losses
        },{
          title: 'Kills: ' + data.playerStatSummaries[9].aggregatedStats.totalChampionKills,
          subtitle: 'Assists: ' + data.playerStatSummaries[9].aggregatedStats.totalAssists
        },{
          title: 'Minion Kills: ' + data.playerStatSummaries[9].aggregatedStats.totalMinionKills,
          subtitle: 'Neutral Kills: ' + data.playerStatSummaries[9].aggregatedStats.totalNeutralMinionsKilled
        },{
          title: 'Turret Kills: ' + data.playerStatSummaries[9].aggregatedStats.totalTurretsKilled
        }]
      };
      rankedSummary.section(0, sectionOne);
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
      var sectionOne = {
        title: 'Unranked 5v5',
        items: [{
          title: 'Wins: ' + data.playerStatSummaries[10].wins
        },{
          title: 'Kills: ' + data.playerStatSummaries[10].aggregatedStats.totalChampionKills,
          subtitle: 'Assists: ' + data.playerStatSummaries[10].aggregatedStats.totalAssists
        },{
          title: 'Minion Kills: ' + data.playerStatSummaries[10].aggregatedStats.totalMinionKills,
          subtitle: 'Neutral Kills: ' + data.playerStatSummaries[10].aggregatedStats.totalNeutralMinionsKilled
        },{
          title: 'Turret Kills: ' + data.playerStatSummaries[10].aggregatedStats.totalTurretsKilled
        }]
      };
      unrankedSummary.section(0, sectionOne);
    }, 
    function(error){
      console.log('The ajax request failed: ' + error);
      unrankedSummary.item(0,0,{ title: 'Loading Failed'});

    }
  );
}
var RSS = require('rss'),
    request = require('request'),
    port = 8080,
    fs = require('fs'),
    underscore = require('underscore');

var parseString = require('xml2js').parseString;
var feed = new RSS({
  title: 'HeyKorean Housing',
  description: 'HeyKorean Housing RSS Feed',
  feed_url: 'http://j96.me/heykorean.xml',
  site_url: 'http://www.heykorean.com/HKBoard/Room/Rent_Main.asp',
  author: 'jjangg96',
  copyright: 'HeyKorean',
  language: 'ko',
  pubDate: (new Date()).toJSON(),
  ttl: '60'
});

request('http://api.heykorean.com/mp/rent/ip_list.aspx?pagecount=400&page=1', function (error, response, body) {
  if (!error && response.statusCode == 200) {
    parseString(body, function (err, result) {
      var detail_url_list = [];
      for(var index in result.Result.Item) {
        var item = result.Result.Item[index];
        detail_url_list.push(item);
      }
      //sort by id
      //don't miss latest from premium posting's order
      detail_url_list = underscore.sortBy(detail_url_list, function(item) { return item.id * -1});
      add_feed(detail_url_list, []);
      
      
    });
  }
})
///mp/rent/ip_detail.aspx?id=503032
///mp/rent/ip_photo.aspx?id=503032

function add_feed(list, return_list) {
  var item = list.shift();
  request('http://api.heykorean.com/mp/rent/ip_detail.aspx?id='+item.id, function(error, response, body){
    if (!error && response.statusCode == 200) {
      parseString(body, function (err, result) {
        return_list.push({
          id: item.id,
          title:  item.title + '(' + item.region + ', ' + item.price + ', ' + item.type + ')',
          author: result.Detail.writer,
          description: '지역 : ' + item.region + '<br/>종류 : ' + item.type + '<br/>가격 : ' + item.price + '<br/>성별 : ' + result.Detail.gender + '<br/>선금 : ' + result.Detail.deposit + '<br/>입주가능 날짜 : ' + result.Detail.midate + '<br/>Period : ' + result.Detail. period + '<br/>condition : ' + result.Detail.condition + '<br/>인터넷 유무 : ' + result.Detail.internet + '<br/>주소 : ' + result.Detail.address + '<br/>내용 : ' + result.Detail.comment,
          url: 'http://www.heykorean.com/hkboard/room/rent_view.asp?id='+item.id,
          date: item.date
        });
        
        
        if( list.length ) {
          add_feed(list, return_list);
        } else {
          add_image(return_list);
        }
      });
    }
  });
}

function add_image(list) {
  var item = list.shift();
  request('http://api.heykorean.com/mp/rent/ip_photo.aspx?id='+item.id, function(error, response, body){
    if (!error && response.statusCode == 200) {
      parseString(body, function (err, result) {
        //add image
        if(result.Photo.hasOwnProperty('Pic'))
        {
          item.description += '<br/>'
          for(var index in result.Photo.Pic)
          {
            item.description += '<img src="' + result.Photo.Pic[index].url + '"><br/>'
          }
        }
        
        feed.item(item);

        if( list.length ) {
          add_image(list);
        } else {
          var xml = feed.xml();

          if(process.argv.length > 2) {
            fs.writeFile(process.argv[2], xml, function(err) {
              if(err) {
                console.log(err);
              } else {
                console.log("Write done");
              }
            });
          } else {
            console.log(xml);  
          }
        }
      });
    }
  });
}
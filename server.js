var RSS = require('rss'),
    request = require('request'),
    port = 8080,
    fs = require('fs');;

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
      
      add_feed(detail_url_list);
      
      
    });
  }
})
///mp/rent/ip_detail.aspx?id=503032
///mp/rent/ip_photo.aspx?id=503032

function add_feed(list) {
  var item = list.shift();
  request('http://api.heykorean.com/mp/rent/ip_detail.aspx?id='+item.id, function(error, response, body){
    if (!error && response.statusCode == 200) {
      parseString(body, function (err, result) {
        feed.item({
          title:  item.title,
          author: result.Detail.writer,
          description: '지역 : ' + item.region + '\n종류 : ' + item.type + '\n가격 : ' + item.price + '\n성별 : ' + result.Detail.gender + '\n선금 : ' + result.Detail.deposit + '\n입주가능 날짜 : ' + result.Detail.midate + '\ncondition : ' + result.Detail.condition + '\n인터넷 유무 : ' + result.Detail.internet + '\n주소 : ' + result.Detail.address + '\n내용 : ' + result.Detail.comment,
          url: 'http://www.heykorean.com/hkboard/room/rent_view.asp?id='+item.id,
          date: item.date
        });
        if( list.length ) {
          add_feed(list);
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
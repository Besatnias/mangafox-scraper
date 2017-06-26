const express = require('express'),
    request = require('request'),
    cheerio = require('cheerio'),
    cors    = require('cors'),
    fs      = require('fs'),
    path    = require('path'),
    CronJob = require('cron').CronJob;

const app = express();

const manga = express.Router();

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

manga.get('/all', cors(), function(req, res) {
    res.sendFile(path.join(__dirname + '/all.json'));
});

// releases/1.htm => Latest manga releases by page (newest to oldest)
manga.get('/releases/:id', cors(), function(req, res) {
    request('http://mangafox.me/releases/' + req.params.id + '.htm', function(err, response, body) {

        const $ = cheerio.load(body);
        const links = $('#updates .series_preview');
        const list = [];
        const json = {
            currentPage: req.params.id,
            pageTotal: $('div#nav li:nth-child(11) > a').text()
        }

        for (var i = 0; i < links.length; i++) {
            const aElement = $(links[i]);

            const name = aElement.text();
            const link = aElement.attr('href');
            const manga_id = aElement.attr('rel');

            list.push({
                manga_id: manga_id,
                cover: 'http://a.mfcdn.net/store/manga/'+ manga_id +'/cover.jpg?',
                name: name,
                link: link
            });
            json.releases = list

        }
        res.send(json);
    });
});

// Everything in /directory defaults to popularity and can be modified by ?az (alphabetical), ?rating and ?latest (chapters)
// If there are pages, it goes /directory/${modifier}/${pagenum}.htm or, if there is no modifier, /directory/${pagenum}.htm

// available paths:

// /directory/${genre}    => manga genres
// /directory/${status}   => no pages, newest manga ordered by ?az ?rating ?latest and default popularity
// /directory/${year}     => any year from 1998 to 2017 or simply /directory/older
// /directory/${letter}   => for all manga that starts with that letter
// /directory             => (blank) for all manga

// also available:

// /directory/older
// /directory/updated
// /directory/ongoing
// /directory/new
// /directory/completed

// list of genres:
// all(leave blank)
// [ "adult", "comedy", "drama", "fantasy", "harem", "horror", "martial-arts", "mecha", "one-shot", "romance", "sci-fi",
// "shoujo", "shounen", "slice-of-life", "sports", "tragedy", "yaoi", "action", "adventure", "doujinshi", "ecchi",
// "gender-bender", "historical", "josei", "mature", "mystery", "psychological", "school-life", "seinen", "shoujo-ai",
// "shounen-ai", "smut", "supernatural", "webtoons", "yuri" ]

// list of alphabetical:
// all(leave blank),
// [ "#", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z" ]

// list to array text: text = "[ \"" + "# a b c d e f g h i j k l m n o p q r s t u v w x y z".split(" ").join("\", \"") + "\" ]"

manga.get('/directory/:id', cors(), function(req, res) {
    request('http://mangafox.me/directory/' + req.params.id, function(err, response, body) {

        var $ = cheerio.load(body);
        var links = $('.manga_text .title');
        var list = [];

        for (var i = 0; i < links.length; i++) {
            var aElement = $(links[i]);

            var name = aElement.text();
            var link = aElement.attr('href');
            var manga_id = aElement.attr('rel');

            list.push({
                manga_id: manga_id,
                cover: 'http://a.mfcdn.net/store/manga/'+ manga_id +'/cover.jpg?',
                name: name,
                link: link
            });

        }
        res.send(list);
    });
});

// /details/one_piece
manga.get('/details/:name', cors(), function(req, res) {
    request('http://mangafox.me/manga/' + req.params.name, function(err, response, body) {

        var $ = cheerio.load(body);
        var json = {
            name : undefined,
            summary: undefined,
            cover: undefined,
            status: undefined,
            volumes: []
        };

        $('#series_info').filter(function() {
            json.cover = $('.cover img').attr('src');
            json.status = $('.data span').text().split('\r\n')[1].trim();
        });

        $('#title').filter(function() {
            json.name = $('h1').text();
            json.summary = $('.summary').text();
        });
        json.author = $('#title td:nth-child(2) > a').text()
        json.artists = $('#title td:nth-child(3) > a').text()
        json.genres = $('#title td:nth-child(4)').text().trim().replace("\r\n", "").split(', ')

        $('#chapters').filter(function() {
            var volume_elms = $('.volume');
            var chapter_elms = $('.chlist');

            for (var i = 0, l = volume_elms.length; i < l; ++i) {
                var elm = $(volume_elms[i]);
                var celm = $(chapter_elms[i]);

                var volume_name = elm.first().text();
                var volume_id = elm.first().text().replace('olume', '').replace('Chapter', '').replace(' ', '').substring(1,4).trim();

                var vlist = {
                    id: volume_id,
                    name: volume_name,
                    chapters: []
                };

                for (var j = 0, ll = celm.children().length; j < ll; ++j) {
                    var chapter = $(celm.children()[j]);

                    var chapter_name = chapter.first().text().split('\r\n')[4].trim();
                    var chapter_id = chapter_name.split(' ')[chapter_name.split(' ').length-1];
                    var chapter_link = chapter.find('a.tips').attr('href');


                    vlist.chapters.push({
                        id: chapter_id,
                        name: chapter_name,
                        link: chapter_link
                    });
                }

                json.volumes.push(vlist);
            }
        });

        res.send(json);
    });
});

// /read/one_piece/whatever/660/10 (manga: one piece, chapter: 660, pagenum: 10, volume is unnecessary, but we need to put something as filler)
manga.get('/read/:name/:volume?/:chapter/:id', cors(), function(req, res) {
    var url = 'http://mangafox.me/manga/' + req.params.name + '/v' + req.params.volume + '/c' + req.params.chapter + '/' + req.params.id + '.html';
    request({ url: url, gzip: true }, function(err, response, body) {

        var $ = cheerio.load(body);
        var json = {
            id: undefined,
            name: undefined,
            title: undefined,
            image: undefined
        };

        $('#series').filter(function() {
            json.id = $('h1').text().split(' ')[$('h1').text().split(' ').length-1];
            json.name = $('h1').text();
            json.title = $('strong a').text();
            json.image = $('#viewer img').attr('src');
            json.currentPage = req.params.id
            json.pageTotal = ($('#top_bar div > div').text()).match(/\tof ([0-9]+)\t/)[1];
        });

        res.send(json);
    });
});
app.use('/manga', manga);

new CronJob('0 * * * *', function() {
    request('http://mangafox.me/manga/', function(err, response, body) {
        var $ = cheerio.load(body);
        var links = $('.series_preview');
        var list = [];

        for (var i = 0; i < links.length; i++) {
            var aElement = $(links[i]);
            var name = aElement.text();
            var link = aElement.attr('href');
            var manga_id = aElement.attr('rel');

            list.push({
                name: name,
                link: link,
                manga_id: manga_id
            });
        }
        fs.writeFile('all.json', JSON.stringify(list, null, 4), function(){
            console.log('File successfully written!');
        });
    });
}, null, true, 'Asia/Tokyo');

app.listen(1337);
console.log('Running on port 1337');

# MangaFox Scraper (fork by Besatnias)
The [original scraper](https://github.com/iamjoey/mangafox-scraper) was made by [iamjoey](https://github.com/iamjoey)

Returns data from MangaFox in json format

## Prerequisites
* install Node
* clone or download this repository
* cd into folder
* npm install

## Run locally
I recommend using nodemon inplace of the standerd node start command. To install nodemon run `npm install -g nodemon`
Then to run the application use `nodemon start` and vist localhost:1337 to check if it works

## Run on production
Use pm2:`pm2 start server.js`

Alternatively, if you're super lazy and don't care about the destruction of your safety and individual app stats, create a macro script to start all your scripts, maybe something like `pm2 start starter` that `require`s all the scripts and runs them. They will all die simultaneously whenever you restart one, but you could just never restart anything unless you reboot the server or update something.

## Routes

All paths are /manga/path (f. ex.: /manga/directory/sci-fi) but I will only list what comes after manga (f. ex.: /directory/sci-fi)

Everything in /directory defaults to popularity and can be modified by ?az (alphabetical), ?rating and ?latest (chapters)
If there are pages, it goes /directory/${modifier}/${pagenum}.htm or, if there is no modifier, /directory/${pagenum}.htm


### /releases/:id

Latest manga releases by page (newest to oldest)

| Variable | Explanation | Example |
| --- | --- | --- |
| `:id` | Page number | 3 |

### /details/:name

| Variable | Explanation | Example |
| --- | --- | --- |
| `:name` | Manga name | one_piece |

### /read/:name/:volume?/:chapter/:id

| Variable | Explanation | Example |
| --- | --- | --- |
| `:name` | Manga name | one_piece |
| `:volume` | Volume of the chapter. It doesn't have to be accurate, Mangafox doesn't check AFAIK. It just has to be there. | `30` or `TBD`|
| `:chapter` | Chapter # | 660 |
| `:id` | Page # | 30 |

**This now returns currentPage and pageTotal**

### /directory

All subpaths in `/directory` default to popularity and can be modified by `?az` (alphabetical), `?rating` and `?latest` (chapters). For example, to see all mangas that start with `x` in rating order, do: `/directory/x?rating`. Note that you won't be able to see the rating of each manga (not implemented).

If there are pages, it goes `/directory/${modifier}/${pagenum}.htm` (ex.: `/directory/sci-fi/3.htm`) or, if there is no modifier, `/directory/${pagenum}.htm` (ex.: `/directory/3.htm`). Example of page number with ordered by latest: `/directory/sci-fi/3.htm?latest`. There is no `?oldest`; just tested.

| Directory | Explanation | Example |
| --- | --- | --- |
| `/directory/:genre` | Genre of manga | `/directory/sci-fi` |
| `/directory/:status` | All manga by status: `ongoing`, `updated`, `completed` and `new`. **Note:** `new` has no pages | `/directory/completed` |
| `/directory/:year` | Any year from 1998 to current year or `/directory/older` for previous years | `/directory/2002` |
| `/directory/:letter` | For all manga that starts with that letter | `/directory/r` |
| `/directory` | Leave blank to see all mangas in your preferred order | `/directory` |
| `/directory/new` | See newest published manga. 

Available statuses for `/directory/:status`:
All (leave blank), updated, ongoing, completed

Available genres for `/directory/:genre`:
All (leave blank), adult, comedy, drama, fantasy, harem, horror, martial-arts, mecha, one-shot, romance, sci-fi, shoujo, shounen, slice-of-life, sports, tragedy, yaoi, action, adventure, doujinshi, ecchi, gender-bender, historical, josei, mature, mystery, psychological, school-life, seinen, shoujo-ai, shounen-ai, smut, supernatural, webtoons, yuri

Available letters for `/directory/:letter`:
All (leave blank), #, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u, v, w, x, y, z

\# is for numbers and special characters

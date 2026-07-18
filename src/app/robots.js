export default function robots(){
  return {
    rules:[
      {userAgent:'*',allow:'/',disallow:'/admin/'},
      {userAgent:['GPTBot','ClaudeBot','Claude-Web','PerplexityBot','Google-Extended','Applebot-Extended'],allow:'/',disallow:'/admin/'}
    ],
    sitemap:'https://www.customwaistbag.com/sitemap.xml'
  };
}

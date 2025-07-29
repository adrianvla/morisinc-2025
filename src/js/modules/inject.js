function inject() {
    //add analytics
    const string = `
    <!-- Yandex.Metrika counter -->
    <script>
       (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
       m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
       (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
    
       ym(89418971, "init", {
            clickmap:true,
            trackLinks:true,
            accurateTrackBounce:true,
            webvisor:true
       });
    </script>
    <noscript><div><img src="https://mc.yandex.ru/watch/89418971" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
    <!-- /Yandex.Metrika counter -->
`;
    if (document && document.head) {
        const temp = document.createElement('div');
        temp.innerHTML = string;
        Array.from(temp.childNodes).forEach(node => {
            document.head.appendChild(node);
        });
    }
}


export default inject;
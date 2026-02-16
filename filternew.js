(function () {
    'use strict';

    if (!window.Lampa) return;

    Lampa.Plugin.add({
        name: 'Country Filter Global',
        version: '2.0',
        description: 'Глобальний фільтр країн для TMDB'
    });

    const STORAGE_KEY = 'lampa_country_filter_settings';

    const countries = [
        {name:'США', code:'US'}, {name:'Велика Британія', code:'GB'},
        {name:'Франція', code:'FR'}, {name:'Німеччина', code:'DE'},
        {name:'Італія', code:'IT'}, {name:'Іспанія', code:'ES'},
        {name:'Польща', code:'PL'}, {name:'Україна', code:'UA'},
        {name:'Індія', code:'IN'}, {name:'Китай', code:'CN'},
        {name:'Японія', code:'JP'}, {name:'Південна Корея', code:'KR'},
        {name:'Туреччина', code:'TR'}, {name:'Канада', code:'CA'},
        {name:'росія', code:'RU'}
    ];

    function getSettings(){
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"exclude":[]}');
    }

    function saveSettings(data){
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function showMenu(){
        let saved = getSettings();

        let items = countries.map(c => ({
            title: c.name,
            code: c.code
        }));

        Lampa.Select.show({
            title: 'Не показувати ці країни',
            items: items,
            onSelect: function(item){

                if(saved.exclude.includes(item.code)){
                    saved.exclude = saved.exclude.filter(i => i !== item.code);
                } else {
                    saved.exclude.push(item.code);
                }

                saveSettings(saved);
                showMenu();
            },
            onBack: function(){
                Lampa.Controller.toggle('menu');
            }
        });
    }

    function patchTMDB(){

        if(!Lampa.Reguest || !Lampa.Reguest.native) return;

        const original = Lampa.Reguest.native;

        Lampa.Reguest.native = function(params, onSuccess, onError){

            let saved = getSettings();

            if(params && params.url && saved.exclude.length){

                if(params.url.indexOf('api.themoviedb.org/3') !== -1){

                    if(params.url.indexOf('without_origin_country') === -1){
                        params.url += (params.url.indexOf('?') > -1 ? '&' : '?') +
                                      'without_origin_country=' +
                                      saved.exclude.join(',');
                    }
                }
            }

            return original.call(this, params, onSuccess, onError);
        };
    }

    function init(){

        Lampa.Component.add('country_filter_global', {
            create: function(){
                showMenu();
                return this.render();
            },
            render: function(){
                return $('<div></div>');
            }
        });

        Lampa.Listener.follow('app', function(e){
            if(e.type === 'ready'){

                Lampa.Menu.add({
                    title: 'Фільтр країн',
                    component: 'country_filter_global',
                    icon: '<svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M3 5h18l-7 8v5l-4 2v-7z"/></svg>'
                });

                patchTMDB();
            }
        });
    }

    init();

})();

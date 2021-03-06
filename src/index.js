import Marionette from 'backbone.marionette';
import Handlebars from 'injectify/runtime';
import {extractView} from 'injectify/utils';

import {defaultManager} from './RegionManager';

import './ReplaceRegion';
import './AsyncReplaceRegion';

let ViewProto = Marionette.View.prototype,
    uniqueId = 0;

/**
 * Helper which allow to specify region from template
 *
 * Usage:
 *
 *   {{region "myRegion"}}
 *   {{region "myAsyncRegion" async=true}}
 *   {{region "myAsyncRegion" async=true promise=customPromise}}
 *   {{region "myAsyncRegion" regionClass=(require "./SomeRegionClass")}}
 *   {{region "myAsyncRegion" regionType="replace_region"}}
 *
 * @param {string} name
 * @param {{hash: {tagName: string, tag: string, async: boolean, regionClass: string, regionType: string}}} options
 * @returns {Handlebars.SafeString}
 */
export default function regionHelper(name, options) {
    let id = 'r' + (++uniqueId).toString(36);

    if (typeof options == "undefined") {
        options = name;
        name = id;
    }

    let selector = '#' + id,
        hash = options.hash,
        tagName = hash.tagName || 'div',
        regionClass = defaultManager.getRegion(hash);

    name = name || id;

    let view = extractView(this, options.hash, options);

    if (view) {
        let params = {
            selector: selector,
            regionClass: regionClass,
            parentEl: function () {
                return view.$el;
            }
        };

        if (hash.promise) {
            params.promise = hash.promise;
        }

        let region = view.addRegion(name, params);
    } else {
        console.warn('Cannot find "view" for region "' + name + '"');
    }

    return new Handlebars.SafeString('<' + tagName + ' id=' + id + '></' + tagName + '>');
};

Handlebars.registerHelper('region', regionHelper);

/**
 * Pass view to template context
 *
 * @param {function} original
 * @returns {Function}
 */
let injectView = function (original) {
    return function (data) {
        data = original.call(this, data);
        data.view = this;

        return data;
    };
};

ViewProto.mixinTemplateHelpers = injectView(ViewProto.mixinTemplateHelpers);

Marionette.Renderer.render = function (template, data, view) {
    if (!template) {
        throw new Marionette.Error({
            name: 'TemplateNotFoundError',
            message: 'Cannot render the template since its false, null or undefined.'
        });
    }

    return String(template(data, {data: {view: view}}));
};

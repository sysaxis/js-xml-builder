"use strict";

/**
 * XMLObject builder that uses Proxies and nested element structue
 * for easily defineable xml structure in json.
 * Makes it impossible to assign values to undefined elements.
 * @author sysaxis
 * Licence: MIT
 */

const CreateProxy = function(obj) {
    return new Proxy({}, obj);
};


const defaults = {
    indent:     '\t',
    newLine:    '\r\n',
    attrSel:    '_',
    attrKey:    null,
    valueSel:   '_value',
    defVal:     '',
    declaration: null,
    selfClose:  true
};

/**
 * @typedef XMLOptions
 * @property {String} indent indent string
 * @property {String} newLine newline string
 * @property {String} attrSel attribute selector
 * @property {String} attrKey attribute key to use when grouping attribute keys under object
 * @property {String} valueSel value selector
 * @property {String} defVal default value to use when element has no declared value
 * @property {String} selfClose allow selfclosing tags
 * @property {Boolean|String} declaration true for default declaration, string for override
 */

/**
 * An object that allows defining xml object with ease.
 * Attributes can be assigned by beggining the name with attrSel ("_" by default), otherwise an element is assigned.
 * @constructor
 * @param {String} name Element's name.
 * @param {Object} elements Elements to assign during construction.
 * @param {XMLOptions} options {indent, newLine, attrSel, attrKey, defVal}
 * 
 * An object that allows defining xml object with ease.
 * Attributes can be assigned by beggining the name with attrSel ("_" by default), otherwise an element is assigned.
 * @constructor
 * @param {Object} elements Elements to assign during construction.
 * @param {XMLOptions} options {indent, newLine, attrSel, attrKey, defVal}
 */
class XMLObject {

    constructor(name, elements, options = defaults) {

        if (options !== defaults) {
            options = Object.assign({}, defaults, options);
        }

        /**
         * Composition logic of XMLObject should be contained in the constructor.
         */

        if (name && typeof(name) === 'object') {
            let rootKeys = Object.keys(name);
            if (rootKeys.length !== 1) {
                throw new Error('object root must have a single element');
            }
            let _name = rootKeys[0];

            if (elements && typeof(elements) === 'object') {
                options = Object.assign({}, defaults, elements);
            }

            elements = name[_name];
            name = _name;
        }

        this.name = name;
        this.options = options;

        if (elements && typeof(elements) === 'object') {
            this.elements = elements;
        }
        else {
            this.elements = {};
        }

        let _options = this.options;
        let _elements = this.elements;

        // the object can be Array or Object

        if (Array.isArray(_elements)) {
            _elements.forEach((element, k) => {
                if (typeof(element) === 'object') {
                    this.elements[k] = new XMLObject(undefined, element, _options);
                }
                else {
                   this.setValue(k, element);
                }

            });
        }
        else {
            Object.keys(_elements).forEach(key => {
                let _val = _elements[key];
                if (key[0] !== _options.attrSel && typeof(_val) === "object") {
                    this.elements[key] = new XMLObject(key, _val, _options);
                }
                else {
                    this.setValue(key, _val);
                }
            });
        }

        return CreateProxy(this);
    }
    
    static get ownFunctions() {
        return ['toXML', 'toObject', 'setValue', 'getAttributeKeys', 'getElementKeys', 'areElementsArray'];
    }

    setValue(prop, val) {
        if (val === undefined) return;
        
        this.elements[prop] = String(val).length > 0 ? val : this.options.defVal;
    }

    get(tgt, prop) {
        if (XMLObject.ownFunctions.includes(prop)) {
            let This = this;
            return function() {
                return XMLObject.prototype[prop].apply(This, arguments);
            }
        }

        if (!this.elements[prop]) {
            this.elements[prop] = new XMLObject(prop, null, this.options);
        }
        return this.elements[prop];
    }

    set(tgt, prop, val) {
        if (val && typeof(val) === "object")
            this.elements[prop] = new XMLObject(prop, val, this.options);
        else
            this.setValue(prop, val);
        
        return true;
    }

    enumerate(tgt, key) {
        return Object.keys(this.elements);
    }

    ownKeys(tgt, key) {
        return Object.keys(this.elements);
    }

    getOwnPropertyDescriptor(tgt, key) {
        let val = this.elements[key];
        return val ? {
          value: val,
          writable: true,
          enumerable: true,
          configurable: true
        } : undefined;
    }

    getAttributeKeys() {
        return Object.keys(this.elements)
            .filter(e => e[0] === this.options.attrSel && e !== this.options.valueSel)
            .map(e => e.substring(1));
    }

    getElementKeys() {
        return Object.keys(this.elements)
            .filter(e => e[0] !== this.options.attrSel && e !== this.options.valueSel);
    }

    getElementValue() {
        return this.elements[this.options.valueSel];
    }

    areElementsArray() {
        let elemKeys = this.getElementKeys();

        return elemKeys.length && elemKeys.every(k => !isNaN(k));
    }

    /**
     * Converts the builder object to a plain object
     * @param {XMLOptions} options 
     */
    toXML(options = defaults, name = this.name, indentLen = 0) {

        if (options !== defaults) {
            options = Object.assign({}, defaults, this.options, options);
        }
        else {
            options = Object.assign({}, options, this.options);
        }

        if (typeof(options.indent) === 'number') {
            options.indent = Array(options.indent).fill(' ').join('');
        }

        let ln = options.newLine,
            indent = options.indent,
            attrSel = options.attrSel;

        let elements = this.elements;
        let indenting = Array(indentLen).fill(indent).join('');
        let attrKeys = this.getAttributeKeys();
        let elemKeys = this.getElementKeys();
        let elemVal = this.getElementValue();

        let xml = '', preindent = '';

        if ('declaration' in options) {
            if (options.declaration === true) {
                xml += '<?xml version="1.0" encoding="UTF-8"?>' + ln;
            }
            else if (typeof(options.declaration) === 'string') {
                xml += options.declaration + ln;
            }
            delete options.declaration;
        }

        if (Array.isArray(this.elements) && this.elements.length === 0) return '';

        // detects and parses an array
        if (this.areElementsArray()) {
            let _name = name,
                _ln = ln,
                _indentLen = indentLen;

            return elemKeys.map(k => {
                let elem = elements[k];
                if (typeof(elem) === 'object') {
                    if (elem.areElementsArray()) {
                        // name is inherited from parent
                        return indenting + `<${_name}>` + elem.toXML({newLine: '', indent: ''}, undefined) + `</${_name}>`;
                    }
                    else {
                        return elem.toXML(options, _name, _indentLen);
                    }
                }
                else {
                    if (!_name) {
                        return formatValue(elem);
                    }
                    else {
                        return indenting + `<${_name}>${formatValue(elem)}</${_name}>`;
                    }
                }
            }).join(_ln);
        }

        // wrap with parent
        if (name) {
            xml += indenting + '<' + name;
            xml += attrKeys.map(k => ` ${k}="${formatValue(elements[attrSel + k])}"`).join('');
            
            if (!elemKeys.length && !elemVal) {
                xml += options.selfClose ? '/>' : `></${name}>`;
                return xml;
            }

            xml += '>';
            preindent = ln + indent;
        }

        if (elemVal) {
            xml += elemVal;
            // wrap with parent
            xml += '</' + name + '>';

            return xml;
        }

        // map elements
        let elemObjs = elemKeys.map(k => {
            if (elements[k] && typeof(elements[k]) === "object") {
                var xml = elements[k].toXML(options, undefined, indentLen + 1);
                return xml.length ? ln + xml : '';
            }

            if (elements[k] === undefined) return;
            if (elements[k] === null) return preindent + indenting + (options.selfClose ? `<${k}/>` : `<${k}></${k}>`);

            return preindent + indenting + `<${k}>${formatValue(elements[k])}</${k}>`;
        });
        xml += elemObjs.join('');

        // wrap with parent
        if (name) {
            xml += ln + indenting + '</' + name + '>';
        }

        return xml;
    }

    /**
     * Returns an object that is no longer an XMLObject.
     * Object is created by nesting funtions where objects assign themselves.
     */
    toObject(current) {

        let _options = this.options;

        let elements = this.elements;
        let attrKeys = this.getAttributeKeys();
        let elemKeys = this.getElementKeys();
        let elemVal = this.getElementValue();

        let self = current || {};

        // detects array
        if (this.areElementsArray()) {
            let arr = self[this.name] = [];
            elemKeys.forEach(k => {
                let elem = elements[k];

                if (typeof(elem) === 'object') {
                    
                    if (elem.areElementsArray()) {
                        let subelemKeys = elem.getElementKeys();

                        subelemKeys.forEach(i => {
                            let subelem = elem[i];
                            if (typeof(subelem) === 'object') {
                                arr.push(elem[i].toObject());
                            }
                            else {
                                arr.push(subelem);
                            }
                        });
                    }
                    else {
                        elem.toObject(arr);
                    }
                }
                else {
                    arr[k] = elem;
                }
            });
            return self;
        }

        let obj;
        if (this.name) {
            obj = self[this.name] = {};
        }
        else {
            obj = self;
        }

        if (attrKeys.length) {
            if (_options.attrKey) {
                let attrs = {};
                attrKeys.forEach(k => {
                    attrs[k] = elements[_options.attrSel + k];
                });

                obj[_options.attrKey] = attrs;
            }
            else {
                attrKeys.forEach(k => {
                    let attr = _options.attrSel + k;
                    obj[attr] = elements[attr];
                });
            }
        }

        if (elemVal) {
            obj[_options.valueSel] = elemVal;
            return self;
        }

        elemKeys.forEach(k =>
            (!elements[k] || typeof(elements[k]) !== 'object') ? 
            obj[k] = elements[k] : 
            elements[k].toObject(obj)
        );
        
        return self;
    }

}

/**
 * Formats value appropriate for XML (replaces special characters)
 * @param {*} value 
 */
function formatValue(value) {
    if (typeof(value) !== 'string') return value;
    [
        ['&',   '&amp;'],
        ["'",   '&apos;'],
        ['>',   '&gt;'],
        ['<',   '&lt;'],
        ['"',   '&quot;']
    ].forEach(e => value = value.replace(
        new RegExp(`${e[0]}`, 'gi'), e[1]
    ));
    return value;
}


module.exports = XMLObject;
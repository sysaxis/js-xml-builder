"use strict";

const fs = require('fs');
const {assert} = require('chai');

const XMLObject = require('../lib/XMLObject');

function loadFixture(filename) {
    var fixture = fs.readFileSync('./test/fixtures/' + filename, 'utf8');
    return filename.endsWith('.json') ? JSON.parse(fixture) : fixture;
}

suite('XMLObject');

var xmlo;

test('new XMLObject(name)', function() {

    xmlo = new XMLObject('test');

    assert.deepEqual({test: {}}, xmlo.toObject());
    assert.equal('<test/>', xmlo.toXML());
});

test('new XMLObject(name, elements)', function() {

    xmlo = new XMLObject('test', {});

    assert.equal('<test/>', xmlo.toXML());
    assert.deepEqual({test: {}}, xmlo.toObject());

    xmlo = new XMLObject('test', 'a');

    assert.equal('<test/>', xmlo.toXML());
    assert.deepEqual({test: {}}, xmlo.toObject());
    
    xmlo = new XMLObject('test', null);

    assert.equal('<test/>', xmlo.toXML());
    assert.deepEqual({test: {}}, xmlo.toObject());
});

test('new XMLObject(name, elements, options)', function() {

    xmlo = new XMLObject('test', {_b: 'c', a: 1}, {indent: '', newLine: ''});

    assert.equal('<test b="c"><a>1</a></test>', xmlo.toXML());
    assert.deepEqual({test: {_b: 'c', a: 1}}, xmlo.toObject());
});

test('new XMLObject(elements, options)', function() {

    assert.throws(function() {
        return new XMLObject({_b: 'c', a: 1}, {indent: '', newLine: ''});
    }, 'object root must have a single element');

    xmlo = new XMLObject({test: {_b: 'c', a: 1}}, {indent: '', newLine: ''});

    assert.equal('<test b="c"><a>1</a></test>', xmlo.toXML());
    assert.deepEqual({test: {_b: 'c', a: 1}}, xmlo.toObject());
});

test('options.indent', function() {

    xmlo = new XMLObject('test', {a: {b: {c: 'def'}}});

    assert.equal('<test>\r\n <a>\r\n  <b>\r\n   <c>def</c>\r\n  </b>\r\n </a>\r\n</test>', xmlo.toXML({indent: ' '}));
    assert.equal('<test>\r\n <a>\r\n  <b>\r\n   <c>def</c>\r\n  </b>\r\n </a>\r\n</test>', xmlo.toXML({indent: 1}));
});

test('options.newLine', function() {

    xmlo = new XMLObject('test', {a: {b: {c: 'def'}}});

    assert.equal('<test>\n\t<a>\n\t\t<b>\n\t\t\t<c>def</c>\n\t\t</b>\n\t</a>\n</test>', xmlo.toXML({newLine: '\n'}));
});

test('options.attrSel', function() {

    xmlo = new XMLObject('test', {}, {attrSel: '$'});
    xmlo.$a = 'abc';

    assert.equal('<test a="abc"/>', xmlo.toXML());
});

test('options.attrKey', function() {

    xmlo = new XMLObject('test', {_a: 1, _b: 'cd'}, {attrKey: '$attrs'});

    assert.deepEqual({test: {$attrs: {a: 1, b: 'cd'}}}, xmlo.toObject());
});

test('options.defVal', function() {

    xmlo = new XMLObject('test', {a: null, b: '', c: undefined}, {defVal: '?'});

    assert.equal('<test>\r\n\t<a/>\r\n\t<b>?</b>\r\n</test>', xmlo.toXML());
});

test('self closing tags', function() {

    xmlo = new XMLObject('test', {a: {}, b: {}});

    assert.equal('<test>\r\n\t<a/>\r\n\t<b/>\r\n</test>', xmlo.toXML());
    assert.deepEqual({test: {a: {}, b: {}}}, xmlo.toObject());
});


test('attribute assignment', function() {

    const options = {indent: '', newLine: ''};

    xmlo = new XMLObject('test');

    xmlo._a = 1;
    xmlo._b = 'ab';

    assert.equal('<test a="1" b="ab"/>', xmlo.toXML(options));

    xmlo.de = {
        _f: 'gh'
    };

    assert.equal('<test a="1" b="ab"><de f="gh"/></test>', xmlo.toXML(options));

    xmlo.de = {
        _f: 'gh',
        i: 'jkl'
    };

    assert.equal('<test a="1" b="ab"><de f="gh"><i>jkl</i></de></test>', xmlo.toXML(options));
});

test('object assignment', function() {

    const options = {indent: '', newLine: ''};

    xmlo = new XMLObject('test');

    xmlo.a = 'b';

    assert.equal('<test><a>b</a></test>', xmlo.toXML(options));
    assert.deepEqual({test: {a: 'b'} }, xmlo.toObject());

    xmlo.a = {d: 'e'};

    assert.equal('<test><a><d>e</d></a></test>', xmlo.toXML(options));
    assert.deepEqual({test: {a: {d: 'e'} } }, xmlo.toObject());
});

test('array assignment', function() {
    
    xmlo = new XMLObject('test');

    xmlo.a = ['b', 'c', {d: 'ef'}];

    assert.equal('<test><a>b</a><a>c</a><a><d>ef</d></a></test>', xmlo.toXML({indent: '', newLine: ''}));
});

test.skip('array element assignment', function() {

    xmlo = new XMLObject('test');

    // not supported!!
    var arr = (xmlo.a = []);

    arr[0] = {b: 2};

    var xml = xmlo.toXML({indent: '', newLine: ''});

});

test('null value assignment', function() {

    xmlo = new XMLObject('test');

    xmlo.a = null;

    assert.equal('<test><a/></test>', xmlo.toXML({indent: '', newLine: ''}));
    assert.deepEqual({test: {a: null}}, xmlo.toObject());
});

test('zero value assignment', function() {

    xmlo = new XMLObject('test');

    xmlo.a = 0;

    assert.equal('<test><a>0</a></test>', xmlo.toXML({indent: '', newLine: ''}));
    assert.deepEqual({test: {a: 0}}, xmlo.toObject());
});

test('escaping', function() {

    var obj = {_a: `<>&'"`, b: `<>&'"`};
    xmlo = new XMLObject('test', obj);

    assert.equal(`<test a="&lt;&gt;&amp;&apos;&quot;">\r\n\t<b>&lt;&gt;&amp;&apos;&quot;</b>\r\n</test>`, xmlo.toXML());
    assert.deepEqual({test: obj}, xmlo.toObject());
});

test('declaration', function() {

    xmlo = new XMLObject('test');

    assert.equal('<?xml version="1.0" encoding="UTF-8"?>\r\n<test/>', xmlo.toXML({declaration: true}));
    
    xmlo = new XMLObject('html', {head: {}, body: {}});

    assert.equal('<!doctype html>\r\n<html>\r\n\t<head/>\r\n\t<body/>\r\n</html>', xmlo.toXML({declaration: '<!doctype html>'}));
});

test('complex object', function() {
    var expected = loadFixture('complex.xml');
    var obj = loadFixture('complex.json');

    var xmlObj = new XMLObject(obj);
    var xml = xmlObj.toXML();

    assert.equal(xml, expected);
});

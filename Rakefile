# -*- coding: utf-8 -*-

require 'crxmake'
require 'json'

class ExtensionMaker

  def initialize
    @config = JSON.parse(open('config.json').read)
    @manifest = JSON.parse(open(File.expand_path('manifest.json', @config['source_dir'])).read)
  end

  def make
    CrxMake.make(
      :ex_dir     => @config['source_dir'],
      :pkey       => @config['pem_file'],
      :crx_output => @config['crx_file'])
    open(@config['update_file'], 'w') do |f|
      f << <<-EOS
<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='#{@config['appid']}'>
    <updatecheck codebase='#{@config['codebase']}' version='#{@manifest['version']}' />
  </app>
</gupdate>
      EOS
    end
  end

  def zip
    CrxMake.zip(
      :ex_dir     => @config['source_dir'],
      :pkey       => @config['pem_file'],
      :zip_output => @config['zip_file'])
  end

  def self.make
    ExtensionMaker.new.make
  end

  def self.zip
    ExtensionMaker.new.zip
  end

end

namespace :extension do
  task :make do
    ExtensionMaker.make
  end

  task :zip do
    ExtensionMaker.zip
  end
end


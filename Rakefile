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
  end

  def zip
    FileUtils.rm_f @config['zip_file']
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

task :default => [ 'src/lib/parser.js' ] do
end

file 'src/lib/parser.js' => [ 'src/lib/parser.jison' ] do |t|
  system "jison #{t.prerequisites[0]} -o #{t.name}"
end

namespace :extension do
  task :make => [ :default ] do
    ExtensionMaker.make
  end

  task :zip => [ :default ] do
    ExtensionMaker.zip
  end
end


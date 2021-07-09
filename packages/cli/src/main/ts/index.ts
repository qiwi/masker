#!/usr/bin/env node

import {masker} from '@qiwi/masker'

console.log(masker.sync(process.argv[2]))

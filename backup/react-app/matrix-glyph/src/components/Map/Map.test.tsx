/*
Author: Eli Elad Elrom
Website: https://EliElrom.com
License: MIT License
Component: src/component/Map/Map.test.tsx
*/

import React from 'react'
import { shallow } from 'enzyme'
import Map from './Map'

describe('<Map />', () => {
  let component

  beforeEach(() => {
    component = shallow(<Map />)
  });

  test('It should mount', () => {
    expect(component.length).toBe(1)
  })
})

const { deDuplicate, groupBy } = require('../utils');

describe('Testing utility methods', () => {
  it('deDuplicate should remove duplicate entries', () => {
    expect(
      deDuplicate(
        [
          { mail: 'pc.writer@backcountry.com', id: 123 },
          { mail: 'pc.writer@backcountry.com', id: 234 },
          { mail: 'pc.editor@backcountry.com', id: 456 },
          { mail: 'pc.admin@backcountry.com', id: 567 }
        ],
        'mail'
      )
    ).toEqual([
      { id: 123, mail: 'pc.writer@backcountry.com' },
      { id: 456, mail: 'pc.editor@backcountry.com' },
      { id: 567, mail: 'pc.admin@backcountry.com' }
    ]);
  });

  it('return expected response for groupBY', () => {
    expect(
      groupBy(
        [
          { hattributevid: 2977, text: 'Tier 1', hattributelid: 422, name: 'Content Treatment' },
          { hattributevid: 2978, text: 'Tier 2', hattributelid: 422, name: 'Content Treatment' },
          { hattributevid: 2979, text: 'Tier 3', hattributelid: 422, name: 'Content Treatment' },
          {
            hattributev_id: 938,
            text: 'Crew',
            hattributelid: 221,
            name: 'Height',
            hattributevid: 938
          },
          {
            hattributev_id: 1685,
            text: 'Over-the-Calf',
            hattributelid: 221,
            name: 'Height',
            hattributevid: 1685
          }
        ],
        (e) => e.name
      )
    ).toEqual({
      'Content Treatment': [
        { hattributelid: 422, hattributevid: 2977, name: 'Content Treatment', text: 'Tier 1' },
        { hattributelid: 422, hattributevid: 2978, name: 'Content Treatment', text: 'Tier 2' },
        { hattributelid: 422, hattributevid: 2979, name: 'Content Treatment', text: 'Tier 3' }
      ],
      Height: [
        {
          hattributelid: 221,
          hattributev_id: 938,
          hattributevid: 938,
          name: 'Height',
          text: 'Crew'
        },
        {
          hattributelid: 221,
          hattributev_id: 1685,
          hattributevid: 1685,
          name: 'Height',
          text: 'Over-the-Calf'
        }
      ]
    });
  });
});

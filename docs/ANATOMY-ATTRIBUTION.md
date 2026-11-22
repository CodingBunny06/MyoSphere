# Anatomy asset attribution

MyoSphere's optional detailed muscle model is derived from **BodyParts3D 4.0**.

- Dataset: BodyParts3D 4.0
- Copyright: The Database Center for Life Science (DBCLS)
- Licence: [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)
- Official dataset licence page: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html
- Publication: Mitsuhashi et al. (2009), *BodyParts3D: 3D structure database for anatomical concepts*, Nucleic Acids Research. https://doi.org/10.1093/nar/gkn613

Required attribution when redistributing or displaying the model:

> Anatomy model: BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International. Modified from BodyParts3D 4.0 by MyoSphere.

The model export used by MyoSphere selects 412 muscle structures, groups them into 15 anatomical regions, converts axes/units for glTF, simplifies geometry, and normalizes normals. The geometry is scan-derived and simplified; it is an educational/reference visualization, not a clinical diagnostic tool or a guarantee of anatomical completeness.

Known omissions in this export include rectus abdominis, latissimus dorsi, internal oblique, and transversus abdominis. Some anatomical structures have duplicate display names; stable BodyParts3D identifiers should be used where available.

The anatomy asset retains its own CC BY 4.0 licence. The MyoSphere application code remains under AGPL-3.0. Do not imply DBCLS endorses MyoSphere. This attribution note is informational and is not legal advice.

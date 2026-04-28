import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { mockConsultants, mockProjects, mockAssignments } from '@/lib/mockData'
import { isAvailableNow } from '@/lib/utils'

const NAVY = '#1a2744'
const RED = '#e63329'
const COLORS = [NAVY, RED, '#3a5a9e', '#7f96c9', '#e57368', '#aab9db']

export default function Analytics() {
  // Utilization per consultant
  const utilizationData = mockConsultants.map((c) => {
    const assigned = mockAssignments.some((a) => a.consultant_id === c.id)
    return {
      name: c.name.split(' ')[0],
      utilization: assigned ? 100 : isAvailableNow(c.available_from) ? 0 : 50,
      fullName: c.name,
    }
  })

  // Project status distribution
  const statusData = [
    { name: 'Open', value: mockProjects.filter((p) => p.status === 'Open').length },
    { name: 'Partially Staffed', value: mockProjects.filter((p) => p.status === 'Partially Staffed').length },
    { name: 'Fully Staffed', value: mockProjects.filter((p) => p.status === 'Fully Staffed').length },
  ].filter((d) => d.value > 0)

  // Skills demand vs supply
  const allRequiredSkills = mockProjects.flatMap((p) => p.skills_required)
  const allConsultantSkills = mockConsultants.flatMap((c) => c.skills)
  const skillSet = Array.from(new Set([...allRequiredSkills, ...allConsultantSkills])).slice(0, 8)
  const skillsData = skillSet.map((skill) => ({
    skill: skill.length > 14 ? skill.slice(0, 12) + '…' : skill,
    demand: allRequiredSkills.filter((s) => s === skill).length,
    supply: allConsultantSkills.filter((s) => s === skill).length,
  }))

  // Bench time (days since available_from for those on bench)
  const benchData = mockConsultants
    .filter((c) => !mockAssignments.some((a) => a.consultant_id === c.id))
    .map((c) => ({
      name: c.name.split(' ')[0],
      days: c.available_from
        ? Math.max(0, Math.floor((new Date().getTime() - new Date(c.available_from).getTime()) / 86400000))
        : 0,
    }))
    .sort((a, b) => b.days - a.days)

  // KPIs
  const utilRate = Math.round((mockAssignments.map((a) => a.consultant_id).filter((v, i, arr) => arr.indexOf(v) === i).length / mockConsultants.length) * 100)
  const avgBench = benchData.length > 0 ? Math.round(benchData.reduce((s, d) => s + d.days, 0) / benchData.length) : 0
  const openCount = mockProjects.filter((p) => p.status !== 'Fully Staffed').length

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-800">Analytics</h1>
        <p className="text-sm text-slate-500">Staffing performance overview</p>
      </div>

      {/* KPI bar */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { label: 'Utilization Rate', value: `${utilRate}%`, sub: 'consultants on project' },
          { label: 'Avg Bench Time', value: `${avgBench}d`, sub: 'for unassigned consultants' },
          { label: 'Open Projects', value: openCount, sub: 'need staffing' },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-5">
              <p className="text-2xl font-bold text-navy-800">{kpi.value}</p>
              <p className="text-sm font-medium text-slate-600">{kpi.label}</p>
              <p className="text-xs text-slate-400">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Utilization per consultant */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Utilization Rate by Consultant</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={utilizationData} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} unit="%" domain={[0, 100]} />
                <Tooltip
                  formatter={(v) => [`${v}%`, 'Utilization']}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
                />
                <Bar dataKey="utilization" fill={NAVY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project status donut */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Project Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Skills supply vs demand */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Skills: Supply vs Demand</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={skillsData} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="skill" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="demand" name="Project Demand" fill={RED} radius={[4, 4, 0, 0]} />
                <Bar dataKey="supply" name="Consultant Supply" fill={NAVY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bench time */}
        {benchData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Bench Time (Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {benchData.map((d) => (
                  <div key={d.name} className="flex items-center gap-3">
                    <p className="w-20 shrink-0 text-sm text-navy-800">{d.name}</p>
                    <div className="flex-1 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-bip-red"
                        style={{ width: `${Math.min(100, (d.days / 60) * 100)}%` }}
                      />
                    </div>
                    <p className="w-10 shrink-0 text-right text-sm font-medium text-slate-600">{d.days}d</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}
